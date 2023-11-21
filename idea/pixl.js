/*

If you're reading this, you're cool :p
*/

const colorsCache = new Map()
const pointCache = new Map()
const Hexify = (red, green, blue) => (red >> 16 | green >> 8 | blue).toString(16).padStart(6, '0')

const __ALCanvas = document.createElement("canvas"); // Asset loading canvas
const __ALContext = __ALCanvas.getContext("2d");
var __loadingAsset;
var __assetId = 0;

const emptyFunction = () => {};

/**
 * @typedef {[red: number, green: number, blue: number]} compactColor
 * @typedef {[priority: number, pixel: compactPixel, origin: {}, color: compactColor]} compactObjectPixel
 * @typedef {[x: number, y: number, ObjectPixels: compactObjectPixel[]]} compactPixel
 * 
 * @param {number} red - The value of red ranging from 0-255
 * @param {number} green - The value of green ranging from 0-255
 * @param {number} blue  - The value of blue ranging from 0-255
 * @returns {compactColor}
 */

function COLOR(red, green, blue) {
    const key = Hexify(red, green, blue)

    const cachedColor = colorsCache.get(key)

    if (cachedColor) {
        return cachedColor
    }
    const color = new Uint8Array([red, green, blue])
    colorsCache.set(key, color)
    return color
}

function POINT(x, y) {
    const key = `${x},${y}`

    const cachedPoint = pointCache.get(key)

    if (cachedPoint) {
        return cachedPoint
    }

    const point = new Uint16Array([x, y])
}



/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {compactPixel}
 */
function PIXEL(x, y) {
    return [x || 0, y || 0, []]
}


/**
 * 
 * @param {compactColor} color 
 * @param {number} x 
 * @param {number} y 
 * @param {Frame} frame 
 * @param {Entity} origin 
 * @param {number} priority 
 * @param {compactPixel} pixel 
 * @param {State} state 
 * @returns 
 */
function OBJECT_PIXEL(color, x, y, frame, origin, priority, pixel, state) {
    return [color, x, y, frame, priority, origin, pixel, state]
}


class Color {
    //Consider using getter/setters if applicable and won't interfere 
    refresh() {
        const base = this.base

        this.red = base[0]
        this.green = base[1]
        this.blue = base[2]
    }
    /**
     * 
     * @param {compactColor} base 
     * @param {ObjectPixel?} hook - used internally; **not intended for use outside of module**
     */
    constructor(base, hook) {
        this.base = base
        this.refresh()


        
        
    }
}

class Point {
    offset(x, y) {
        return new Point(POINT(this.x + x, this.y + y))
    }
    constructor(base) {
        this.base = base 
        this.x = base[0]
        this.y = base[1]
    }
}

class ObjectPixel {
    get state() {
        return this.base[7]
    }

    set state() {
        throw new Error("can't set the state of an object pixel")
    }

    get priority() {
        return this.base[3]
    }
    set priority(priority) {
        this.base[3] = priority
    }

    get pixel() {
        return this.base[6]
    }

    /** 
     * @param {Pixel} newPixel
     */
    set pixel(newPixel) {
        const initalPixel = new Pixel(this.pixel)
        initalPixel.removeObject(this)
        newPixel.addObject(this)

        this.base[6] = newPixel.base
    }

    get origin() {
        return this.base[5]
    }

    set origin(newOrigin) {
        this.base[5] = newOrigin
    }

    get color() {
        return new Color(this.base[0], this)
    }

    /**
     * @param {Color} color
     */
    set color(color) {
        this.color = new Color(color.base)
    }
    /**
     * 
     * @param {compactObjectPixel} base 
     */
    constructor(base) {
        this.base = base 
    }
}

class Pixel {
    /**
     * 
     * @param {compactPixel} base 
     */
    constructor(base) {
        this.base = base 

        this.x = base["0"]
        this.y = base["1"]
        this.objects = base["2"]
    }

    /**
     * 
     * @param {ObjectPixel} objectPixel 
     */
    addObject(objectPixel) {
        this.base["2"].push(objectPixel.base)
    }

    /**
     * 
     * @param {ObjectPixel} objectPixel 
     */
    removeObject(objectPixel) {
        const index = this.base[2].findIndex(element => element === objectPixel.base) // **
        if (index !== -1) {
            return this.base[2].splice(index, 1)[0]
        }
    }
}

class Asset {
    constructor(ID, source) {
        this.ID = ID;
        this.source = source
    }
}


class ImageAsset extends Asset {
    pixels = []
    /**
     * 
     * @param {*} ID 
     * @param {*} source 
     * @param {HTMLImageElement} image
     * @param {integer} defaultPriority 
     */
    constructor(ID, source, image, defaultPriority, metaLayers) {
        super(ID, source)
        const imageData = __ALContext.getImageData(0, 0, image.width, image.height).data;
        for (let x = 0; ++x < image.width;) {
            for (let y = 0; ++y < image.height;) {
                const n = (image.width * y + x) << 2;
                const color = COLOR(imageData[n], imageData[n + 1], imageData[n + 2]);
                this.pixels.push([x, y, color, defaultPriority]);
            }
        }
    }
}

/**
 * Load an image asset into the pixel engine. 
 * @param {string} imagePath The path of the image
 * @returns {promise} asset
 */


async function loadImageAsset(imagePath) {
    const ID = ++__assetId;
    const image = new Image();
    image.crossOrigin = "Anonymous"


    await __loadingAsset;


    const asset = new Promise(async (resolve, reject) => {
       image.src = imagePath;

       image.onload = () => {
        __ALContext.clearRect(0, 0, image.width, image.height);
        const assetdata = {
            pixels: [],
        };

        __ALContext.drawImage(image, 0, 0);
        
        resolve(new ImageAsset(ID, imagePath, image))
        
       };
    });

    __loadingAsset = asset;
/**
 * @typedef {asset} imageAsset
 */
    return await asset
}

class PositionedFrame {
    x = 0
    y = 0
    pixels = []
    /**
     * 
     * @param {Frame} frame 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(frame, x, y) {
        this.x = x 
        this.y = y
        this.base = frame 
        this.positionedPixels = []
        for (objectPixel in this.base.objectPixels) {  
            this.positionedPixels.push([x + objectPixel[1], y + objPixel[2], objectPixel])
        }
    }
}


/**
 * @class Frame
 * @property {Array[compactObjectPixel]} objectPixels
 */
class Frame {
    meta = {
        layers: [],
        colorTags: {}
    }
    objectPixels = []

    calculate(x, y) {
        return new PositionedFrame(this, x, y)
    }
    base
    /**
     * @param {ImageAsset} imageAsset
     * @param {Entity} entity
     */
    constructor(imageAsset, entity, state) {
        this.base = imageAsset 
        this.objectPixels = []

        for (pixelData in this.base.pixels) {
            const x = pixelData[0];
            const y = pixelData[1];
            const color = pixelData[2];
            const priority = pixelData[3];
            const objPixel = OBJECT_PIXEL(color, x, y, this, entity, priority, _, state)
            this.objectPixels.push(objPixel)
        }
    }
}


class State {
    name 
    frames
    /**
     * 
     * @param {string} stateName 
     * @param {Array<Frame>} frames 
     */ 
    constructor(stateName, ...frames) {
        this.name = stateName
        this.frames = frames
    }
}

class Canvas {
    resX = 0
    resY = 0
    pixelSize = 16
    canvas = []
    constructor(resX, resY, pixelSize) {
        for (X = 0; ++X < resX;) {
            this.canvas[X] = []
            for (Y = 0; ++Y < resY;) {
                this.canvas[X][Y] = new Pixel(PIXEL(X, Y))
            }
        } 
    }
}

class Entity {
   init = emptyFunction
   tick = emptyFunction
   processFrame = emptyFunction
   beforeFrame = emptyFunction
   onFrame = emptyFunction
   onCreate = emptyFunction

   states = []
   tick = 0

   __objectPixels = []
   /**
    * @function __GETFRAME
    * @returns {Frame}
    */
   __GETFRAME() {

   }

   __APPLYFRAME() {
    const lastObjectPixels = this.__objectPixels
    const newObjectPixels = []
    const currentFrame = this.__GETFRAME()
    const calculatedCurrentFrame = currentFrame.calculate()

    for (var objectPixel of lastObjectPixels) {
        
    }
   }

   position = POINT(0, 0)
   set position(position) {
    this.position = position.base ||  position
   }
   get position() {
    return  new Point(this.position)
   }

   /**
    * 
    * @param {Canvas} canvas 
    */

   constructor(canvas) {
    this.canvas = canvas
   }
}




(async () => {
    console.log(await loadImageAsset("https://cdn.math-rad.com/files/index/seamonster.png"))
})()
