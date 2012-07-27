var ctx;
var ticks = 0;
var spriteMap = new Image;
var itemMap = new Image;
var enemyMap = new Image;
var actors;
var items = [];

var gameInterval;

var current_level;
var score = 0

// position displayed level
var scroll_x = 120;
// scroll position at the beginning of the game loop
var scroll_x_start = 0;
// 5 free lines on top, 13 lines of level content
var line_offset_y = 5;

var held = {left:false, right:false, up:false, down:false};
var collisionMap;


// speed, gravity parameters
var speed = {
    player:{
        velocity_x:1.5,
        velocity_x_jump:1,
        velocity_y:25,
        gravity:2,
        friction:0.8,
        speed_limit_x:10,
        speed_limit_y:25
    },
    fps: 30
}

// size details about various aspects of the game
var size = {
    tile:{ // size of tiles
        source:{w:16, h:16},
        target:{w:32, h:32}
    },
    tiles:{ // number of tiles
        source:{w:13, h:11},
        target:{w:1, h:1} // this is set dynamically depending on the canvas size
    },
    canvas:{w:1, h:1} // the canvas size is read from the actual html
};


function $(id) {
    return document.getElementById(id);
}

String.prototype.replaceAt = function (index, char) {
    return this.substr(0, index) + char + this.substr(index + char.length);
}

function replaceLevelSprite(x, y, item) {
    line_nr = y / size.tile.target.h - line_offset_y
    current_level.level[line_nr] = current_level.level[line_nr].replaceAt(x / size.tile.target.w, item);
}


function drawLevel() {

    // clear the canvas before repainting
    ctx.clearRect(0, 0, size.canvas.w, size.canvas.h);
    collisionMap = [];

    // cache tile sizes
    var sw = size.tile.source.w;
    var sh = size.tile.source.h;
    var tw = size.tile.target.w;
    var th = size.tile.target.h;


    if (scroll_x < 0) {
        scroll_x = 0;
    }
    scroll_x_start = scroll_x;

    current_level.level.forEach(function (linecontent, index_y) {

            index_y += line_offset_y;

            // context.drawImage(img,x,y,width,height);
            // context.drawImage(img,sx,sy,swidth,sheight,dx,dy,dwidth,dheight);

            // first tile to display:
            var index_x_start = scroll_x / size.tile.target.w
            var offset_x = scroll_x % size.tile.target.w
            // last tile to show
            var index_x_max = index_x_start + size.tiles.target.w + 1

            for (var index_x = index_x_start; index_x < index_x_max; index_x++) {

                var object = { sx:null, sy:null, x:((index_x) * tw) - offset_x, y:index_y * th, deadly:false, solid:true };
                switch (linecontent.charAt(index_x)) {
                    case '#':
                        object.sx = 5;
                        object.sy = 0;
                        collisionMap.push(object);
                        break;
                    case 'x':
                        object.sx = 0;
                        object.sy = 0;
                        collisionMap.push(object);
                        break;
                    case '/':
                        object.sx = 0;
                        object.sy = 1;
                        break;
                    case '^':
                        object.sx = 1;
                        object.sy = 0;
                        break;
                    case 'ü':
                        object.sx = 1;
                        object.sy = 1;
                        break;
                    case 'g':
                        object.sx = 4;
                        object.sy = 1;
                        break;
                    case '`':
                        object.sx = 2;
                        object.sy = 1;
                        break;
                    case '{':
                        object.sx = 2;
                        object.sy = 0;
                        break;
                    case '=':
                        object.sx = 3;
                        object.sy = 0;
                        break;
                    case '}':
                        object.sx = 4;
                        object.sy = 0;
                        break;
                    case '@':
                        object.sx = 9;
                        object.sy = 2;
                        object.deadly = true;
                        collisionMap.push(object);
                        break;
                    case '1':
                        object.sx = 0;
                        object.sy = 7;
                        break;
                    case '2':
                        object.sx = 1;
                        object.sy = 7;
                        break;
                    case '3':
                        object.sx = 2;
                        object.sy = 7;
                        break;
                    case '4':
                        object.sx = 0;
                        object.sy = 8;
                        break;
                    case '5':
                        object.sx = 1;
                        object.sy = 8;
                        break;
                    case '6':
                        object.sx = 2;
                        object.sy = 8;
                        break;
                    case '?':
                        object.sx = 0;
                        object.sy = 11;
                        object.type = 'block_coin'
                        collisionMap.push(object);
                        break;
                    case 'ß':
                        object.sx = 1;
                        object.sy = 11;
                        collisionMap.push(object);
                        break;
                    case 'q':
                        object.sx = 0;
                        object.sy = 2;
                        collisionMap.push(object);
                        break;
                    case 'w':
                        object.sx = 1;
                        object.sy = 2;
                        collisionMap.push(object);
                        break;
                    case 'a':
                        object.sx = 0;
                        object.sy = 3;
                        collisionMap.push(object);
                        break;
                    case 's':
                        object.sx = 1;
                        object.sy = 3;
                        collisionMap.push(object);
                        break;
                    case 'b':
                        object.sx = 13;
                        object.sy = 4;
                        break;
                    default:
                }
                if (object.sx != null && object.sy != null) {
                    ctx.drawImage(spriteMap, object.sx * (sw + 1) + 0.5, object.sy * (sh + 1) + 0.5, sw - 0.8, sh - 0.8, object.x - index_x_start * tw, object.y, tw, th);
                }
            }


        }
    );

}


// update position of characters, collision detection
function updateCharacters() {

    actors.forEach(function (actor) {

        if (actor.speed.y == 0) {
            if (held.left && actor.speed.y == 0) {
                actor.speed.x -= speed.player.velocity_x;
            } else if (held.right && actor.speed.y == 0) {
                actor.speed.x += speed.player.velocity_x;
            }
        } else if (Math.abs(actor.speed.x) < speed.player.velocity_x) {
            if (held.left) {
                actor.speed.x -= speed.player.velocity_x_jump;
            } else if (held.right) {
                actor.speed.x += speed.player.velocity_x_jump;
            }
        }
        if (held.up && actor.speed.y == 0) {
            actor.speed.y -= speed.player.velocity_y;
        } else if (held.down) {
            // this only causes a duck animation, nothing happens in term of speed
        }

        animate_actor(actor);

        // apply gravity.
        actor.speed.y += speed.player.gravity;
        if (Math.abs(actor.speed.x) < 0.8) actor.speed.x = 0;
        if (Math.abs(actor.speed.y) < 0.1) actor.speed.y = 0;

        // apply speed limit
        if (Math.abs(actor.speed.x) > speed.player.speed_limit_x) {
            actor.speed.x = speed.player.speed_limit_x * actor.speed.x / Math.abs(actor.speed.x)
        }
        if (Math.abs(actor.speed.y) > speed.player.speed_limit_y) {
            actor.speed.y = speed.player.speed_limit_y * actor.speed.y / Math.abs(actor.speed.y)
        }

        actor.pos.x += actor.speed.x;
        actor.pos.y += actor.speed.y;

        // block on level edge
        if (actor.pos.x < 0) {
            actor.pos.x = 0;
        } else if (actor.pos.x + size.tile.target.w > current_level.width) {
            actor.pos.x = current_level.width - size.tile.target.w;
        }

        collisionMap.forEach(function (object) {

            var collides = checkCollision(actor, object);

            // special actions on collisions
            if (collides.top) {
                if (object.type == 'block_coin') {
                    replaceLevelSprite(object.x, object.y, "ß");
                    items.push({ sx:8, sy:9, x:object.x, y:(object.y - size.tile.target.h), deadly:false, type:'coin' });
                }
            }
            if (collides.top || collides.bottom || collides.right || collides.left) {
                if (object.deadly == true) {
                    gameOver();
                }
                if (object.type == 'coin') {
                    items.splice(items.indexOf(object), 1);
                    score++;
                }
            }

            // apply collision to player movement
            if (object && object.solid) {
                if (collides.top) {
                    actor.pos.y = object.y + size.tile.target.h;
                    actor.speed.y = 1;
                    // intentionally skip right/left bounce
                    collides.right = false;
                    collides.left = false;
                } else if (collides.bottom) {
                    actor.pos.y = object.y - size.tile.target.h;
                    actor.speed.y = 0;
                }
                if (collides.right) {
                    actor.pos.x = object.x - size.tile.target.w;
                    actor.speed.x = 0;
                } else if (collides.left) {
                    actor.pos.x = object.x + size.tile.target.w;
                    actor.speed.x = 0;
                }
            }
        })

        // move the player when the level is at it's border, else move the level
        if (scroll_x <= 0) {
            if (actor.pos.x > (size.canvas.w / 2)) {
                scroll_x = 1;
            }
        } else if (scroll_x >= current_level.width - size.canvas.w) {
            scroll_x = current_level.width - size.canvas.w;
            if (actor.pos.x < current_level.width - (size.canvas.w / 2)) {
                scroll_x = current_level.width - size.canvas.w - 1;
            }
        } else {
            scroll_x += actor.speed.x;
        }

        // apply friction
        if (actor.speed.y == 0) {
            actor.speed.x *= speed.player.friction;
        }

    });
}


function checkCollision(actor, object) {
    var collides = {top:false, bottom:false, left:false, right:false};
    // we are below or above an object
    if (actor.pos.x + size.tile.target.w >= (object.x + size.tile.target.w * 0.3) && actor.pos.x <= object.x + size.tile.target.w * 0.7) {
        // check bounce bottom:
        if (actor.pos.y + size.tile.target.h >= object.y && actor.pos.y < object.y) {
            collides.bottom = true;
            // check bounce top:
        } else if (actor.pos.y <= (object.y + size.tile.target.h) && actor.pos.y > object.y) {
            collides.top = true;
        }
    }
    // we are right or left of an object
    if ((actor.pos.y >= object.y) && (actor.pos.y <= (object.y + size.tile.target.h) )) {
        // check bounce right
        if (actor.pos.x + size.tile.target.w >= object.x && actor.pos.x + size.tile.target.w < (object.x + size.tile.target.w )) {
            collides.right = true;
        }
        // check bounce left
        if (actor.pos.x < ( object.x + size.tile.target.w ) && actor.pos.x > object.x) {
            collides.left = true;
        }
    }
    return collides;
}


function animate_actor(actor) {
    if (actor.speed.x > 0) {
        actor.sprite.y = 16;
    } else if (actor.speed.x < 0) {
        actor.sprite.y = 48;
    }

    if (actor.speed.y != 0) {
        actor.sprite.x = 85;
    } else {
        if (actor.speed.x == 0) {
            actor.sprite.x = 0;
        } else if (actor.sprite.x >= 48) {
            actor.sprite.x = 16;
        } else if (Math.abs(actor.speed.x) > 1 && (ticks % 3 == 0)) {
            actor.sprite.x += 16;
        }
    }
    if (held.down) {
        // todo: ducken
    }
}

function updateElements() {

}

function updateCollisionMap() {
    // add items to collision check, todo: only add visible items
    collisionMap = collisionMap.concat(items);
}

function drawControls() {
    var actor = actors[0];
    ctx.strokeText("Player: x/y: " + Math.round(actor.pos.x) + "/" + Math.round(actor.pos.y) +
        ", speed x/y: " + Math.round(actor.speed.x) + "/" + Math.round(actor.speed.y), size.tile.target.w, size.tile.target.h);
    ctx.strokeText("Scroll: " + Math.round(scroll_x) + "px - tile#: " + Math.round(scroll_x / size.tile.target.w), size.tile.target.w, size.tile.target.h * 2);
    ctx.strokeText("Objects: " + (collisionMap.length + items.length), size.tile.target.w, size.tile.target.h * 3);

    ctx.strokeText("Coins: : " + score, size.canvas.w - 100, size.tile.target.h);
}


function drawActors() {
    actors.forEach(function (actor) {
        ctx.drawImage(
            actor.spriteMap,
            actor.sprite.x,
            actor.sprite.y,
            actor.size.w,
            actor.size.h,
            actor.pos.x - scroll_x_start,
            actor.pos.y,
            size.tile.target.w,
            size.tile.target.h
        );
    });
}


function drawElements() {
    items.forEach(function (item) {
        ctx.drawImage(
            spriteMap,
            item.sx * (size.tile.source.w + 1) + 0.5,
            item.sy * (size.tile.source.h + 1) + 0.5,
            size.tile.source.w - 0.8,
            size.tile.source.h - 0.8,
            item.x - scroll_x_start,
            item.y,
            size.tile.target.w,
            size.tile.target.h
        );

    });
}


function gameOver() {
    // todo: dying animation
    ctx.strokeText("Game Over", size.tile.target.w * 5, size.tile.target.h * 6);
    window.clearInterval(gameInterval);

}


function initializeLevel(level) {
    current_level = level;
    level.width = level.level[0].length * size.tile.target.w;
}


window.onkeydown = function (e) {
    switch (e.keyCode) {
        case 37: // left
            held.left = true;
            break;
        case 32: // space
            held.up = true;
            break;
        case 38: // up
            held.up = true;
            break;
        case 39: // right
            held.right = true;
            break;
        case 40: // down
            held.down = true;
            break;
        default:
            return;
    }
    return false; // cancel regular key
};

// of course we now also need to register keyup
window.onkeyup = function (e) {
    switch (e.keyCode) {
        case 37: // left
            held.left = false;
            break;
        case 32: // space
            held.up = false;
            break;
        case 38: // up
            held.up = false;
            break;
        case 39: // right
            held.right = false;
            break;
        case 40: // down
            held.down = false;
            break;
        default:
            return;
    }
    return false; // cancel regular key
};


function gameLoop() {
    ticks++;

    drawLevel();

    // add visible items + actors to collision map
    updateCollisionMap();

    updateCharacters();
    updateElements();

    drawActors();
    drawElements();
    drawControls();
}


function initGame() {

    var canvas = $("game");
    ctx = canvas.getContext("2d");

    size.canvas.w = canvas.offsetWidth;
    size.canvas.h = canvas.offsetHeight;
    size.tiles.target.w = size.canvas.w / size.tile.target.w
    size.tiles.target.h = size.canvas.h / size.tile.target.h

    spriteMap.src = 'images/smb_tiles.png';
    itemMap.src = 'images/smb_items_sheet.png';
    enemyMap.src = 'images/smb_enemies_sheet.png';

    player = {
        pos:{x:25 * size.tile.target.w, y:10 * size.tile.target.h},
        sprite:{x:0, y:16},
        size:{w:16, h:16},
        speed:{x:0, y:0}
    };

    player.spriteMap = new Image;
    player.spriteMap.src = 'images/mario_sprites.png';
    actors = [player];

    initializeLevel(levels[2]);

    gameInterval = setInterval(gameLoop, 1000 / speed.fps);
}


window.onload = function () {
    initGame();
}