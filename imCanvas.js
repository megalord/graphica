var imCanvas = {

    /*
     *  a library of functions used for interacting with images
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

    // loops through each pixel in the object's 2d pixel array (this.pixels)
    //   and executes the given function
    loopPixels:function(fn) {
        var n = this.width*this.height,
            x = this.width-1,
            y = this.height-1;
        while(n--) {
            fn.call(this, x, y, this.pixels[x][y]);
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
    },

    // read the pixels in the source context
    //   and convert the image data into a 2d pixel array
    read:function(context) {
        this.setDimensions(context.canvas.width, context.canvas.height);
        var image = context.getImageData(0, 0, this.width, this.height),
            // detatch image data for better performance as per
            // www.onaluf.org/en/entry/13
            imageData = image.data,
            n = imageData.length,
            x = this.width-1,
            y = this.height-1;
        this.pixels = this.create2dPixelArray();
        while(n) {
            // write the color data to the 2d array
            // order is a, b, g, r
            // extract all values of r
            this.pixels[x][y] = imageData[n -= 4];
            /*this.pixels[x][y] = {
                a:imageData[--n],
                b:imageData[--n],
                g:imageData[--n],
                r:imageData[--n]
            };*/
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
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
    write:function(context) {
        var pix = 4 * this.width * this.height,
            image = context.createImageData(this.width, this.height),
            imageData = image.data,
            x = this.width-1,
            y = this.height-1;
        while(pix) {
            var i = this.pixels[x][y];
            // order is a, b, g, r
            imageData[--pix] = 255;
            imageData[--pix] = i;
            imageData[--pix] = i;
            imageData[--pix] = i;
            if(x === 0) {
                x = this.width-1;
                y--;
            }else{
                x--;
            };
        };
        context.canvas.width = this.width;
        context.canvas.height = this.height;
        context.putImageData(image, 0, 0);
    }

};
