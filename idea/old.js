const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = 'player.png';

        // Adjust the canvas size and scale
        const scale = 100 / 16;
        canvas.width = 2 * 100 * scale;
        canvas.height = 2 * 100 * scale;

        let x = 0;
        let y = 0;

        function updateCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x * scale * 8, y * scale * 8, 100 * scale, 100 * scale);

            requestAnimationFrame(updateCanvas);
        }

        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    y -= 1;
                    break;
                case 'ArrowDown':
                    y += 1;
                    break;
                case 'ArrowLeft':
                    x -= 1;
                    break;
                case 'ArrowRight':
                    x += 1;
                    break;
                // You can add more cases for other key events if needed
            }
        });

        img.onload = updateCanvas;