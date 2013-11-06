var imp = {

    /*
     *  a library of functions used for processing images
     *  that are drawn using the html5 canvas element
     */


    // create a new 2d pixel array that can be used by the
    //   write() method to print the pixel data
    // uses the object's width and height if not provided
    //   as function arguments
    create2dPixelArray:function(width, height) {
        if(arguments.length === 0) {
            var width = this.width,
                height = this.height;
        };
        var x = width,
            y = height-1,
            pixels = new Array(width);
        // begin by initializing the lengths of the arrays in both dimensions
        while(x--) {
            pixels[x] = new Array(height);
        };
        return pixels;
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

    // add gaussian noise based on given mu and sigma
    // the noise is approximated using 3 random numbers in [0,1]
    // formula credited to www.protonfish.com/random.shtml
    gaussianNoise:function(mu, sigma) {
        this.read();
        this.loopPixels(function(x, y, i) {
            this.pixels[x][y] = this.greyToRGBA(i + Math.round((2*(Math.random()+Math.random()+Math.random())-3) * sigma + mu));
        });
        this.write();
    },

    greyToRGBA:function(i) {
        return {
            r:i,
            g:i,
            b:i,
            a:255
        };
    },

    histogram:function() {
        var dist = new Array(255);
        for(var i = 0; i < 256; i++) {
            dist[i] = 0;
        };
        this.read();
        this.loopPixels(function(x, y) {
            dist[this.pixels[x][y].r]++;
        });
        scale = 250/Math.max.apply({}, dist);
        this.targetContext.clearRect(0, 0, 300, 300);
        this.targetContext.beginPath();
        for(var i = 0; i < 256; i++) {
            this.targetContext.moveTo(i+10, 275);
            this.targetContext.lineTo(i+10, Math.round(275-scale*dist[i]));
        };
        this.targetContext.strokeStyle = 'rgba(0, 0, 0, 1)';
        this.targetContext.stroke();
        this.targetContext.fillText('0', 10, 290);
        this.targetContext.fillText('255', 250, 290);
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
            fn.call(this, x, y, this.pixels[x][y].r);
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
    },

    // set the base context (for reading)
    // and the target context (for writing)
    // this function should be called before each operation
    prepare:function(sourceContext, targetContext) {
        this.sourceContext = sourceContext;
        this.targetContext = targetContext;
    },

    quantize:function(type, b, q) {
        // start by createing a quantizer 
        var j = 0,
            quantizer = new Array(256);
        if(type === 'linear') {
            var lin = this.linearSpacing(arguments[1]),
                b = lin.b,
                q = lin.q;
        };
        for(var i = 0; i < 256; i++) {
            // if i equals the next bound
            if(b[j+1] === i) {
                j++
            };
            quantizer[i] = q[j];
        };
        this.read();
        this.loopPixels(function(x, y, i) {
            this.pixels[x][y] = this.greyToRGBA(quantizer[i]);
        });
        this.write();
    },

    // read the pixels in the source context
    //   and convert the image data into a 2d pixel array
    read:function() {
        this.setDimensions(this.sourceContext.canvas.width, this.sourceContext.canvas.height);
        var image = this.sourceContext.getImageData(0, 0, this.width, this.height),
            // detatch image data for better performance as per
            // www.onaluf.org/en/entry/13
            imageData = image.data,
            pix = imageData.length,
            x = this.width-1,
            y = this.height-1;
        this.pixels = this.create2dPixelArray();
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

    sample:function(period) {
        if(this.width % period !== 0 || this.height % period !== 0) {
            return false;
        };
        var pixels = create2dPixelArray(this.width/period, this.height/period);
        this.read();
        this.loopPixels(function(x, y) {
            if(x % period === 0 && y % period === 0) {
                pixels[x/period][y/period] = greyToRGBA(this.pixels[x][y].r);
            };
            // else write whitespace?
        });
        this.pixels = pixels;
        this.setDimensions(this.width/period, this.height/period);
        this.write();
    },

    // set the width and height of the image that will be
    //   manipulated by the rest of the functions
    // this is easier than specifying these parameters as arguments
    //   to each function
    setDimensions:function(width, height) {
        this.width = width;
        this.height = height;
    },

    // convert the 2d pixels array stored in this.pixels
    //   to image data and write it to the target context
    write:function() {
        var pix = 4 * this.width * this.height,
            image = this.targetContext.createImageData(this.width, this.height),
            imageData = image.data,
            x = this.width-1,
            y = this.height-1;
        while(pix) {
            imageData[--pix] = this.pixels[x][y].a;
            imageData[--pix] = this.pixels[x][y].b;
            imageData[--pix] = this.pixels[x][y].g;
            imageData[--pix] = this.pixels[x][y].r;
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
        this.targetContext.canvas.width = this.width;
        this.targetContext.canvas.height = this.height;
        this.targetContext.putImageData(image, 0, 0);
    }
};
