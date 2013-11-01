var imp = {
    config:function(width, height) {
        this.width = width;
        this.height = height;
    },

    prepare:function(baseCtx, targetCtx) {
        this.baseCtx = baseCtx;
        this.targetCtx = targetCtx;
    },

    filter:function(scale, mask, centerX, centerY) {
        var height = mask.length,
            width = mask[0].length;
        if(scale !== 1) {
            if(scale.indexOf('/') !== -1) {
                fractionParts = scale.split('/');
                scale = Math.round(fractionParts[0]/fractionParts[1]);
            };
            for(var y = 0; y < height; y++) {
                for(var x = 0; x < width; x++) {
                    mask[x][y] = Math.round(scale*mask[x][y]);
                };
            };
        };
        loopPixels(function(x, y) {
            var sum = 0;
            for(var y = 0; y < height; y++) {
                for(var x = 0; x < width; x++) {
                    sum += Math.round(scale*mask[x][y]);
                };
            };
        });
    },

    gaussianNoise:function(mu, sigma) {
        loopPixels(pixels, function(x, y) {
            var newValue = pixels[x][y].r + Math.round((2*(Math.random()+Math.random()+Math.random())-3) * sigma + mu);
            pixels[x][y] = {
                r:newValue,
                g:newValue,
                b:newValue,
                a:255
            };
        });
        setPixels(ctx, pixels, 0, 0);
    },

    histogram:function() {
        var dist = new Array(256);
        for(var i = 0; i < 256; i++) {
            dist[i] = 0;
        };
        this.read();
        this.loopPixels(function(x, y) {
            dist[this.pixels[x][y].r]++;
        });
        scale = 250/Math.max.apply({}, dist);
        this.targetCtx.clearRect(0, 0, 300, 300);
        this.targetCtx.beginPath();
        for(var i = 0; i < 256; i++) {
            this.targetCtx.moveTo(i+10, 275);
            this.targetCtx.lineTo(i+10, Math.round(275-scale*dist[i]));
        };
        this.targetCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
        this.targetCtx.stroke();
        this.targetCtx.fillText('0', 10, 290);
        this.targetCtx.fillText('255', 250, 290);
    },

    linearSpacing:function(levels) {
        var b = [0],
            q = [];
        for(var i = 0; i < levels; i++) {
            b.push(Math.round(255/levels*(i+1)));
            q.push(Math.round((b[i+1]+b[i])/2));
        };
        return {b:b, q:q};
    },

    loopPixels:function(fn) {
        var pix = this.width*this.height,
            x = this.width-1,
            y = this.height-1;
        while(pix--) {
            fn.call(this, x, y);
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
    },

    quantize:function(type) {
        var b, q,
            j = 0,
            quantizer = new Array(255);
        if(type === 'linear') {
            lin = linearSpacing(arguments[1]);
            b = lin.b;
            q = lin.q;
        }else if(type === 'custom') {
            b = arguments[1];
            q = arguments[2];
        };
        for(var i = 0; i < 256; i++) {
            // if i equals the next bound
            if(b[j+1] === i) {
                j++
            };
            quantizer[i] = q[j];
        };
        loopPixels(pixels, function(x, y) {
            var newValue = quantizer[pixels[x][y].r];
            pixels[x][y] = {
                r:newValue,
                g:newValue,
                b:newValue,
                a:255
            };
        });
        setPixels(ctx, pixels, 0, 0);
    },

    read:function() {
        var image = this.baseCtx.getImageData(0, 0, this.width, this.height),
            // detatch image data for better performance as per
            // www.onaluf.org/en/entry/13
            imageData = image.data,
            pix = imageData.length,
            x = this.width,
            y = this.height-1;
        this.pixels = new Array(this.width);
        // begin by initializing the lengths of the arrays in both dimensions
        while(x--) {
            this.pixels[x] = new Array(this.height);
        };
        x = this.width-1;
        while(pix) {
            // write the color data to the 2d array
            this.pixels[x][y] = {
                a:imageData[--pix],
                b:imageData[--pix],
                g:imageData[--pix],
                r:imageData[--pix]
            };
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
    },

    write:function(ctx, pixels, offsetX, offsetY) {
        var width = pixels.length,
            height = pixels[0].length,
            pix = 4 * width * height,
            image = ctx.createImageData(width, height),
            imageData = image.data,
            x = width-1,
            y = height-1;
        while(pix) {
            imageData[--pix] = pixels[x][y].a;
            imageData[--pix] = pixels[x][y].b;
            imageData[--pix] = pixels[x][y].g;
            imageData[--pix] = pixels[x][y].r;
            if(x === 0) {
                x = width-1;
                y--;
            }else{
                x--;
            };
        };
        ctx.putImageData(image, offsetX, offsetY);
    }
};


/*var sigma = 1,
    mu = 0,
    i = 1000,
    dist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    sum = 0;
while(i--) {
    dist[5 + Math.round((2*(Math.random()+Math.random()+Math.random())-3) * sigma + mu)]++;
};
for(var i = 0; i < 11; i++) {
    dist[i] = dist[i] / 1000;
    sum += dist[i];
};
console.log(dist, sum);*/

