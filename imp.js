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
            pixels = new Array(width);
        // begin by initializing the lengths of the arrays in both dimensions
        while(x--) {
            pixels[x] = new Array(height);
        };
        return pixels;
    },

    // apply the provided filter to the image
    filter:function(scale, mask, centerX, centerY) {
        // maybe change dimensions... depends on input form
        var z,
            height = mask.length,
            width = mask[0].length;
        this.read();
        z = this.zeroPad(centerY, width - centerX - 1, height - centerY - 1, centerX);
        if(scale !== 1) {
            if(scale % 1 !== 0) {
                // scale is not an integer
                if(scale.indexOf('/') !== -1) {
                    fractionParts = scale.split('/');
                    scale = Math.round(fractionParts[0]/fractionParts[1]);
                }else if(scale.indexOf('.') !== -1) {
                    // parse into float
                };
            };
        };
        this.loopPixels(function(x, y) {
            var sum = 0;
            for(var m = 0; m < height; m++) {
                for(var n = 0; n < width; n++) {
                    sum += z[x - centerX + n][y - centerY + m].r * mask[n][m];
                };
            };
            this.pixels[x][y] = this.greyToRGBA(Math.round(sum*scale));
        });
        this.write();
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

    // turn a single intensity into a rgba object for use in a 2d pixel array
    greyToRGBA:function(i) {
        return {
            r:i,
            g:i,
            b:i,
            a:255
        };
    },

    // create a plot of the intensity distribution in the stored 2d pixel array
    // not finished yet
    histogram:function() {
        var scale,
            dist = new Array(256);
        for(var i = 0; i < 256; i++) {
            dist[i] = 0;
        };
        this.read();
        this.loopPixels(function(x, y, i) {
            dist[i]++;
        });
        scale = 250/Math.max.apply({}, dist);   // why apply?
        this.targetContext.canvas.width = this.width;
        this.targetContext.canvas.height = this.height;
        this.targetContext.clearRect(0, 0, this.width, this.height);
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

    // generate boundaries and quantization points that are linearly spaced
    // used solely by the quantize() method
    linearSpacing:function(levels) {
        var b = [0],
            q = [];
        for(var i = 0; i < levels; i++) {
            b.push(Math.round(255/levels*(i+1)));
            q.push(Math.round((b[i+1]+b[i])/2));
        };
        return {b:b, q:q};
    },

    // loops through each pixel in the object's 2d pixel array (this.pixels)
    //   and executes the given function
    loopPixels:function(fn) {
        var n = this.width*this.height,
            x = this.width-1,
            y = this.height-1;
        while(n--) {
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

    // quantize each pixel using the provided ranges and quantization values
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
            n = imageData.length,
            x = this.width-1,
            y = this.height-1;
        this.pixels = this.create2dPixelArray();
        while(n) {
            // write the color data to the 2d array
            this.pixels[x][y] = {
                a:imageData[--n],
                b:imageData[--n],
                g:imageData[--n],
                r:imageData[--n]
            };
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
    },

    // not finished yet
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
    },

    // zero-pad the stored 2d pixel array
    // not finished yet
    zeroPad:function(top, right, bottom, left) {
        var pixels = this.create2dPixelArray(),
            width = this.width + left + right,
            height = this.width + top + bottom,
            arr = new Array(height);
        // first create a deep clone of the 2d pixel array
        this.loopPixels(function(x, y, i) {
            pixels[x][y] = this.greyToRGBA(i);
        });
        // pad the 2d pixel array in the x-direction 
        // for each value of x, pixels[x] is an array,
        //   so an array of zeros with length equal to the height
        for(var y = 0; y < height; y++) {
            arr[y] = this.greyToRGBA(0);
        };
        for(var i = 0; i < left; i++) {
            pixels.unshift(arr);   // .slice(0)??
        };
        for(var i = 0; i < right; i++) {
            pixels.push(arr);
        };
        // pad the 2d pixel array in the y-direction 
        for(var x = left, xlen = width - right; x < xlen; x++) {
            for(var i = 0; i < top; i++) {
                pixels[x].unshift(this.greyToRGBA(0));
            };
            for(var i = 0; i < bottom; i++) {
                pixels[x].push(this.greyToRGBA(0));
            };
        };
        return pixels;
    }
};
