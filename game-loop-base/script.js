let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

// x, y - posicionar o objeto
// r - Definir o raio do círculo
// vx, vy - define a velocidade horizontal e vertical
const player = { x: 40, y: 160, r: 16, vx: 120, vy: 150 };

let last = 0; // marca a posição do último frame

// Eu uso dt porque ele garante que a velocidade da minha bola seja baseada
// no tempo real que passou, e não na taxa de atualização (FPS) do monitor. 
// Assim, o jogo roda na mesma velocidade em qualquer computador!

function update(dt){
    // Atualiza a posição horizontal e vertical
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    
    // Bate nas paredes laterais e volta
    if (player.x + player.r > canvas.width || player.x - player.r < 0){
        player.vx *= -1;
    }

    // Bate no teto/chão e volta
    if (player.y + player.r > canvas.height || player.y - player.r < 0){
        player.vy *= -1;
    }
}

function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhando o círculo
    ctx.fillStyle = "#30e742ff"; 
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillText("deltatime (dt) aplicado", 12, 20);
}

function loop(ts){
    // Checa se 'last' NÃO tem valor (é zero) no primeiro frame
    if(!last) last = ts; 

    let dt = Math.min(0.05, (ts - last) / 1000); // ms para s
    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// Executa a primeira vez
requestAnimationFrame(loop);