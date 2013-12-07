var imProcess = {

    /*
     *  a library of functions used for processing images
     *  that are drawn using the html5 canvas element
     */

    fft2d:function() {
        // for HTML5 Canvas
        var spectrum = document.querySelector('#Spectrum').getContext('2d'),
            result = document.querySelector('#Result').getContext('2d'),
            image = new Image();
        image.src = '/path/to/image';
        image.addEventListener('load', function(e) {
          var w = image.width,
              h = image.height, // w == h
              re = [],
              im = [];

          // initialize, radix-2 required
          FFT.init(w);
          FrequencyFilter.init(w);
          SpectrumViewer.init(spectrum);
          spectrum.drawImage(image, 0, 0);
          var src = spectrum.getImageData(0, 0, w, h),
              data = src.data,
              radius = 30,
              i, val, p;
          for(var y=0; y<h; y++) {
            i = y*w;
            for(var x=0; x<w; x++) {
              re[i + x] = data[(i << 2) + (x << 2)];
              im[i + x] = 0.0;
            }
          }
          // 2D-FFT
          FFT.fft2d(re, im);
          // swap quadrant
          FrequencyFilter.swap(re, im);
          // High Pass Filter
          FrequencyFilter.HPF(re, im, radius);
          // Low Pass Filter
          FrequencyFilter.LPF(re, im, radius);
          // Band Path Filter
          FrequencyFilter.BPF(re, im, radius, radius/2);
          // render spectrum
          SpectrumViewer.render(re, im);
          // swap quadrant
          FrequencyFilter.swap(re, im);
          // 2D-IFFT
          FFT.ifft2d(re, im);
          for(var y=0; y<h; y++) {
            i = y*w;
            for(var x=0; x<w; x++) {
              val = re[i + x];
              p = (i << 2) + (x << 2);
              data[p] = data[p + 1] = data[p + 2] = val;
            }
          }
          // put result image on the canvas
          result.putImageData(src, 0, 0);
        }, false);
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
                    sum += z[x - centerX + n][y - centerY + m] * mask[n][m];
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
    gaussian:function(mu, sigma) {
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = i + Math.round((2*(Math.random()+Math.random()+Math.random())-3) * sigma + mu);
        });
        imCanvas.write(this.targetContext);
    },

    // create a plot of the intensity distribution in the stored 2d pixel array
    // not finished yet
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

    // apply a mean filter to the image
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
    // not finished yet
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
        };
        for(var i = 0; i < 256; i++) {
            // if i equals the next bound
            if(b[j+1] === i) {
                j++
            };
            quantizer[i] = q[j];
        };
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            this.pixels[x][y] = quantizer[i];
        });
        imCanvas.write(this.targetContext);
    },

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
    sample:function(period) {
        if(this.width % period !== 0 || this.height % period !== 0) {
            return false;
        };
        var pixels = create2dPixelArray(this.width/period, this.height/period);
        imCanvas.read(this.sourceContext);
        imCanvas.loopPixels(function(x, y, i) {
            if(x % period === 0 && y % period === 0) {
                pixels[x/period][y/period] = i;
            };
        });
        //this.pixels = pixels;
        this.setDimensions(this.width/period, this.height/period);
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

    // zero-pad the stored 2d pixel array
    // not finished yet
    zeroPad:function(top, right, bottom, left) {
        console.log(top, right, bottom, left);
        var pixels = imCanvas.create2dPixelArray(),
            width = imCanvas.width + left + right,
            arr = new Array(imCanvas.height);

        // first create a deep clone of the 2d pixel array
        imCanvas.loopPixels(function(x, y, i) {
            pixels[x][y] = i;
        });

        // pad the 2d pixel array in the x-direction 
        // for each value of x, pixels[x] is an array,
        //   so an array of zeros with length equal to the height
        for(var y = 0; y < imCanvas.height; y++) {
            arr[y] = 0;
        };
        for(var i = 0; i < left; i++) {
            pixels.unshift(arr);
        };
        for(var i = 0; i < right; i++) {
            pixels.push(arr);
        };

        // pad the 2d pixel array in the y-direction 
        for(var x = 0; x < width; x++) {
            for(var i = 0; i < top; i++) {
                pixels[x].unshift(0);
            };
            for(var i = 0; i < bottom; i++) {
                pixels[x].push(0);
            };
        };
        return pixels;
    }

};
