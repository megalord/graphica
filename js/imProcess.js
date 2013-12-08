var imProcess = {

    /*
     *  a library of functions used for processing images
     *  that are drawn using the html5 canvas element
     *
     *  dependent on the imCanvas utility library
     */

    close:function(se) {
        this.erode(se);
        this.sourceContext = this.targetContext;
        this.dilate(se);
    },

    // dilate using the structuring element
    dilate:function(se) {
        // setup variables
        var pixels, z, width, height;
        se = JSON.parse(se);
        height = se.length;
        width = se[0].length;
        imCanvas.read(this.sourceContext);
        pixels = imCanvas.create2dPixelArray(0);

        imCanvas.loopPixels(function(x, y, i) {
            if(i === 255) {
                for(var m = 0; m < height; m++) {
                    for(var n = 0; n < width; n++) {
                        if(pixels[x + n] && typeof pixels[x + n][y + m] === 'number') pixels[x + n][y + m] = 255;
                    };
                };
            };
        });
        imCanvas.pixels = pixels;
        imCanvas.write(this.targetContext);
    },

    erode:function(se) {
        // setup variables
        var pixels, z, width, height, padX, padY;
        se = JSON.parse(se);
        height = se.length;
        width = se[0].length;
        imCanvas.read(this.sourceContext);
        pixels = imCanvas.create2dPixelArray();
        padX = Math.floor(width/2);
        padY = Math.floor(height/2);

        // erode using the structuring element
        imCanvas.loopPixels(function(x, y) {
            var hit = true;
            outer:for(var m = 0; m < height; m++) {
                for(var n = 0; n < width; n++) {
                    if(se[m][n] === 1 && (this.pixels[x + n] && typeof this.pixels[x + n][y + m] === 'number'
                      && this.pixels[x + n][y + m] !== 255)) {
                        hit = false;
                        break outer;
                    };
                };
            };
            pixels[x][y] = hit ? 255 : 0;
        });
        imCanvas.pixels = pixels;
        imCanvas.write(this.targetContext);
    },

    // add exponential noise to the image
    exponential:function(lambda, scale) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = Math.round(i + scale*(Math.log(1-Math.random())/-lambda));
        });
        imCanvas.write(this.targetContext);
    },

    // apply the provided filter to the image
    filter:function(mask, scale, centerX, centerY) {
        // maybe change dimensions... depends on input form
        // setup variables
        var pixels, z, width, height;
        mask = JSON.parse(mask);
        height = mask.length;
        width = mask[0].length;
        imCanvas.read(this.sourceContext);
        pixels = imCanvas.create2dPixelArray();
        z = this.zeroPad(centerY, width - centerX - 1, height - centerY - 1, centerX);

        // apply the filter
        imCanvas.loopPixels(function(x, y) {
            var sum = 0;
            for(var m = 0; m < height; m++) {
                for(var n = 0; n < width; n++) {
                    sum += z[x + n][y + m] * mask[m][n];
                };
            };
            pixels[x][y] = Math.round(sum*scale);
        });
        imCanvas.pixels = pixels;
        imCanvas.write(this.targetContext);
    },

    // apply the gamma (power-law) transform
    gamma:function(c, gamma) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = Math.round(c*Math.pow(i, gamma));
        });
        imCanvas.write(this.targetContext);
    },

    // add gaussian noise based on given mu and sigma
    // the noise is approximated using 3 random numbers in [0,1]
    // formula credited to www.protonfish.com/random.shtml
    gaussian:function(mu, sigma, scale) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = Math.round(i + scale*((2*(Math.random()+Math.random()+Math.random())-3) * sigma + mu));
        });
        imCanvas.write(this.targetContext);
    },

    // convert a color image to greyscale
    grayscale:function() {
        imCanvas.readColor(this.sourceContext);
        imCanvas.write(this.targetContext);
    },

    // create a plot of the intensity distribution in the stored 2d pixel array
    histogram:function() {
        var scale,
            dist = new Array(256);
        for(var i = 0; i < 256; i++) dist[i] = 0;
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            dist[i]++;
        });
        scale = 250/Math.max.apply({}, dist);
        this.width = 300; this.height = 300;
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

    // equalize the distribution of intensities
    // using the histogram equalization method
    // pr(r[k]) = n[k]/n
    // s[k] = (L-1)*sum(pr(r[j]), j, 0, k)
    histogramEq:function() {
        var totalPixels,
            pr = new Array(255),
            s = new Array(255),
            sum = 0;

        // start with an array of zeros
        for(var i = 0; i < 256; i++) pr[i] = 0;

        // count all the values
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            pr[i]++;
        });

        // create a map of old intensities to new ones
        totalPixels = imCanvas.width * imCanvas.height;
        for(var i = 0; i < 256; i++) {
            sum += pr[i]/totalPixels;
            s[i] = Math.round(255*sum);
        };

        // apply the created intensity map
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = s[i];
        });
        imCanvas.write(this.targetContext);
    },

    // create a tabular representation of the 2d pixel array
    inspect:function(context) {
        var cell, row,
            fragment = document.createDocumentFragment(),
            table = document.createElement('table'),
            tableBody = document.createElement('tbody');
        imCanvas.read(context);
        imCanvas.loopPixels(function(x, y, i) {
            if(x === imCanvas.width - 1) {
                if(y < imCanvas.height - 2) {
                    tableBody.insertBefore(row, tableBody.firstChild);
                }else if(y === imCanvas.height - 2) {
                    tableBody.appendChild(row);
                };
                row = document.createElement('tr');
            };
            cell = document.createElement('td');
            cell.textContent = i;
            cell.title = x+', '+y;
            if(x === imCanvas.width - 1) {
                row.appendChild(cell);
            }else{
                row.insertBefore(cell, row.firstChild);
            };
        });
        table.appendChild(tableBody);
        table.className = 'frame';
        table.style.width = '300px';
        table.style.height = '300px';
        table.style.overflow = 'scroll';
        fragment.appendChild(table);
        return fragment;
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

    // apply the log transform to the image
    log:function(c) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = Math.round(c*Math.log(1+i)/Math.log(10));
        });
        imCanvas.write(this.targetContext);
    },

    open:function(se) {
        this.dilate(se);
        this.sourceContext = this.targetContext;
        this.erode(se);
    },

    // apply a median filter to the image
    median:function(size) {
        var pixels,
            offset = Math.floor(size/2),
        median = function(arr) {
            var half;
            arr.sort(function(a, b) { return a - b; });
            half = Math.floor(arr.length/2);
            if(arr.length % 2 === 1) {
                return arr[half];
            }else{
                return Math.round((arr[half-1] + arr[half])/2);
            };
        };
        imCanvas.read(this.sourceContext);
        pixels = imCanvas.create2dPixelArray();
        imCanvas.loopPixels(function(x, y) {
            var localPixels = [];
            for(var m = -offset; m < offset; m++) {
                for(var n = -offset; n < offset; n++) {
                    if(this.pixels[x + n] && this.pixels[x + n][y + m]) {
                        localPixels.push(this.pixels[x + n][y + m]);
                    };
                };
            };
            pixels[x][y] = median(localPixels);
        });
        imCanvas.pixels = pixels;
        imCanvas.write(this.targetContext);
    },
    
    // create a negative of the image
    negative:function() {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = 255-i;
        });
        imCanvas.write(this.targetContext);
    },

    // apply piecewise linear transform
    piecewiseLinear:function(r1, s1, r2, s2) {
        var m1 = s1/r1,
            m2 = (s2-s1)/(r2-r1),
            b2 = s2 - m2*r2,
            m3 = (255-s2)/(255-r2),
            b3 = 255 - m3*255;
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            var newVal;
            if(i < r1) {
                newVal = m1*i;
            }else if(i < r2) {
                newVal = m2*i + b2;
            }else{
                newVal = m3*i + b3;
            };
            this.pixels[x][y] = Math.round(newVal);
        });
        imCanvas.write(this.targetContext);
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
        } else {
            b = JSON.parse(b);
            q = JSON.parse(q);
        };
        for(var i = 0; i < 256; i++) {
            quantizer[i] = q[j];
            if(b[j+1] === i) j++
        };

        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = quantizer[i];
        });
        imCanvas.write(this.targetContext);
    },

    // add salt and pepper noise to the image
    saltAndPepper:function(salt, pepper) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            var rand = 100*Math.random();
            if(rand < salt) {
                this.pixels[x][y] = 255;
            }else if(rand > 100-pepper) {
                this.pixels[x][y] = 0;
            };
        });
        imCanvas.write(this.targetContext);
    },

    // sample the image at the specified period
    // this will result in a smaller image (with less information)
    // not finished yet
    sample:function(period) {
        imCanvas.read(this.sourceContext);
        var width = Math.floor(imCanvas.width/period),
            height = Math.floor(imCanvas.height/period),
            pixels = imCanvas.create2dPixelArray(width, height);
        imCanvas.loopPixels(function(x, y, i) {
            if(x % period === 0 && y % period === 0) {
                pixels[x/period][y/period] = i;
            };
        });
        imCanvas.pixels = pixels;
        imCanvas.width = width;
        imCanvas.height = height;
        imCanvas.write(this.targetContext);
    },

    // threshold the image using the provided value
    threshold:function(cutoff) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = i >= cutoff ? 255 : 0;
        });
        imCanvas.write(this.targetContext);
    },

    // add uniform noise to the image
    uniform:function(a, b, scale) {
        var diff = b - a;
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = Math.round(i + scale*Math.random()*diff);
        });
        imCanvas.write(this.targetContext);
    },

    // zero-pad the stored 2d pixel array
    zeroPad:function(top, right, bottom, left) {
        var pixels = imCanvas.create2dPixelArray(imCanvas.width + right + left, imCanvas.height + top + bottom, 0);

        // clone the image onto a portion of the new 2d pixel array
        imCanvas.loopPixels(function(x, y, i) {
            pixels[x + left][y + top] = i;
        });

        return pixels;
    }

};
