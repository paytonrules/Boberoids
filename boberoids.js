

$(function() {

  // Game Over
  // Music
  // Effects

  var Boberoids = (function() {
    var context,
        spaceBackground,
        player,
        bulletImage,
        spiderImage,
        bullets = [],
        spiders = [],
        startTicks,
        lastGeneration,
        laserBeam,
        gameOn = true,
        explosion,
        pop,
        backgroundMusic,
        playerState = {rotatingLeft: false, rotatingRight: false, rotationAngle: 0};

    function start() {
      lastGeneration = (new Date()).getTime();
      gameOn = true;
      getContext();
      bindKeys();

      load();
      setInterval(loop, 1000 / 60);
    };

    function load() {
      var spaceImage = $("<img src='images/space_background.png'>");
      spaceImage.load(function() {
        spaceBackground = spaceImage.get(0);
      });

      var playerImage = $("<img src='images/player.png'>");
      playerImage.load(function() {
        player = playerImage.get(0);
      });

      var bulletJQueryImage = $("<img src='images/bullet.png'>");
      bulletJQueryImage.load(function() {
        bulletImage = bulletJQueryImage.get(0);
      });

      var spiderJQueryImage = $("<img src='images/bug_sprite.png'>");
      spiderJQueryImage.load(function() {
        spiderImage = spiderJQueryImage.get(0);
      });

      backgroundMusic = $("<audio src='sounds/agelessspaceship.mp3' loop='loop'>");
      backgroundMusic.bind("canplaythrough", function() {
        backgroundMusic.get(0).play();
      });

      var laserBeamJQuery = $("<audio src='sounds/laser.mp3'>");
      laserBeamJQuery.bind("canplaythrough", function() {
        laserBeam = laserBeamJQuery.get(0);
      });

      var explosionJQuery = $("<audio src='sounds/explosion.mp3'>");
      explosionJQuery.bind("canplaythrough", function() {
        explosion = explosionJQuery.get(0);
      });

      var popJQuery = $("<audio src='sounds/pop.mp3'>");
      popJQuery.bind("canplaythrough", function() {
        pop = popJQuery.get(0);
      });
    };

    function fire() {
      var facingX = Math.cos(playerState.rotationAngle);
      var facingY = Math.sin(playerState.rotationAngle);
     
      bullets.push({x: 400, y: 300, rotationAngle: playerState.rotationAngle, facingX: facingX, facingY: facingY});
      laserBeam.play();
    };

    function rotatePlayer() {
      if (playerState.rotatingLeft) {
        playerState.rotationAngle -= 0.15;
      }
      else if(playerState.rotatingRight) {
        playerState.rotationAngle += 0.15;
      }
    };

    function moveBullets() {
      _(bullets).each(function(bullet) {
        bullet.x += bullet.facingX * 4;
        bullet.y += bullet.facingY * 4;
      });
    };

    function update() {
      if (gameOn) {
        rotatePlayer();

        moveBullets();
        generateNewSpiders();
        moveSpiders();
        checkCollisions();
      }
    };

    function generateNewSpiders() {
      var SPAWN_RATE = 2000,
          currentTime = (new Date).getTime();

      if ((currentTime - lastGeneration) > SPAWN_RATE) {
        generateSpider();
        lastGeneration = currentTime;
      } 
    };

    function generateSpider() {
      var x = Math.floor((Math.random() * 1000 ) - 100),
          y = Math.floor((Math.random() * 800 ) - 100);

      if ( x > 0 && x < 800 && y > 0 && y < 600 ) {
        // the spawn point is inside the world.  Push it up or down.
        if ( y < 300 ) {
          y = -100;
        }
        else {
          y = 700;
        }
      }

      var directionVector = {x: 400 - x, y: 300 - y };
      var directionLength = Math.sqrt(directionVector.x * directionVector.x + directionVector.y * directionVector.y);
      var normalizedDirectionVector = {x: directionVector.x / directionLength, y: directionVector.y / directionLength};
  
      spiders.push({x: x, y: y, directionVector: normalizedDirectionVector});
    };

    function moveSpiders() {
      _(spiders).each(function(spider) {
        spider.x += spider.directionVector.x * 2;
        spider.y += spider.directionVector.y * 2;
      });
    };

    function checkCollisions() {
      checkCollisionsWithSpidersAndBullets();
      checkCollisionsWithSpidersAndPlayer();
    };

    function checkCollisionsWithSpidersAndBullets() {
      _(spiders).each(function(spider) {
        var spiderRectangle = {left: spider.x, top: spider.y, right: spider.x + 96, bottom: spider.y + 88};
        _(bullets).each(function(bullet) {
          var bulletRectangle = {left: bullet.x, top: bullet.y, right: bullet.x + 23, bottom: bullet.y + 7};
          if (rectanglesIntersect(spiderRectangle, bulletRectangle)) {
            spiders = _(spiders).difference([spider]);
            bullets = _(bullets).difference([bullet]);
            pop.play();
            return;
          }
        });
      });
    };

    function checkCollisionsWithSpidersAndPlayer() {
      _(spiders).each(function(spider) {
        var spiderRectangle = {left: spider.x, top: spider.y, right: spider.x + 96, bottom: spider.y + 88};
        var playerRectangle = {left: 415, top: 315, right: 450, bottom: 340};

        if (rectanglesIntersect(spiderRectangle, playerRectangle)) {
          gameOn = false;
          explosion.play();
          return;
        }
      });
    };


    function rectanglesIntersect(rectangleOne, rectangleTwo) {
      return !(rectangleTwo.left > rectangleOne.right
               || rectangleTwo.right < rectangleOne.left
               || rectangleTwo.top > rectangleOne.bottom
               || rectangleTwo.bottom < rectangleOne.top );
    };

    function clearBackground() {
      context.fillStyle = "#000000";
      context.fillRect(0, 0, 800, 600);
    };

    function draw() {
      clearBackground();
      if (spaceBackground) {
        context.drawImage(spaceBackground, 0, 0);
      }

      if (player) {
        context.save(); //save current state in stack
        context.setTransform(1,0,0,1,0,0); // reset to identity

        //translate the canvas origin to the center of the player
        context.translate(400, 300);
        context.rotate(playerState.rotationAngle);

        context.drawImage(player, -37, -30);
        context.restore();
      }

      _(bullets).each(function(bullet) {
        context.save();
        context.setTransform(1,0,0,1,0,0);
        context.translate(bullet.x, bullet.y);
        context.rotate(bullet.rotationAngle);
        context.drawImage(bulletImage, -23, -7);
        context.restore();
      });

      _(spiders).each(function(spider) {
        context.save();
        context.setTransform(1,0,0,1,0,0);
        context.translate(spider.x, spider.y);
        context.drawImage(spiderImage, -48, -44);
        context.restore();
      });

      if (gameOn === false) {
        context.fillStyle = "#FF0000";
        context.font = "bold 60px sans-serif";
        context.fillText("Game Over", 200, 200); 
        context.font = "bold 24px sans-serif";
        context.fillText("Can't kill bugs eh?  I guess you'd rather work for Obtiva.", 100, 270);
      }
    };

    function keyup(e) {
      switch (event.which) {
        case 65: // a
          playerState.rotatingLeft = false;
          break;
        case 83: //s
          playerState.rotatingRight = false;
          break;
      };
    };

    function keydown(e) {
      switch (event.which) {
        case 65: // a
          playerState.rotatingLeft = true;
          break;
        case 83: //s
          playerState.rotatingRight = true;
          break;
      };
    };

    function keypress(e) {
      switch (event.which) {
        case 108: // l
          fire();
          break;
      }
    };

    function loop() {
      update();
      draw();
    };

    function bindKeys() {
      $(document.documentElement).bind("keydown", function(e) {
        keydown(e);
      });

      $(document.documentElement).bind("keyup", function(e) {
        keyup(e);
      });
      
      $(document.documentElement).bind("keypress", function(e) {
        keypress(e);
      });
    };
    
    function getContext() {
      var canvas = $("#boberoids");
      context = canvas[0].getContext("2d");
    };

    function stop() {
      gameOn = false;
      if (backgroundMusic) {
        backgroundMusic.get(0).pause();
      }
    };
   
    return {
      start: start,
      stop: stop
    };
  })();

  Boberoids.start();
});
