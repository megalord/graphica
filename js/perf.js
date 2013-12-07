var c = document.getElementById('c'),
    ctx = c.getContext('2d');
    img = document.getElementById('testImg');
img.onload = function() {
    ctx.drawImage(img, 0, 0);

var width = 300,
    height = 300;

console.log('while loop');
var start = Date.now(),
    arr = new Array(width);
while(--arr >= 0) {
    arr[width] = new Array(height);
};
console.log(Date.now() - start);
console.log(arr);

console.log('for loop');
var start = Date.now(),
    arr = new Array(width);
for(var i = 0, ilen = width; i < ilen; i++) {
    arr[i] = new Array(height);
};
console.log(Date.now() - start);

console.log('getting image data');
var start = Date.now(),
    image = ctx.getImageData(0, 0, width, height);
console.log(Date.now() - start);

console.log('parsing image data');
var start = Date.now(),
    imageData = image.data,
    pix = imageData.length;
    x = width-1,
    y = height-1;
while(pix) {
    arr[x][y] = {
        a:imageData[--pix],
        b:imageData[--pix],
        g:imageData[--pix],
        r:imageData[--pix]
    };
    if(x === 0) {
        x = width-1;
        y--;
    }else{
        x--;
    };
};
console.log(Date.now() - start);

/*console.log('parsing image data');
var start = Date.now(),
    imageData = image.data,
    pix = imageData.length;
    x = width-1,
    y = height-1;
for(var i = 0, ilen = imageData.length; i < ilen; i + 4) {
    // write the color data to the 2d array
    arr[x][y] = {
        r:imageData[i],
        g:imageData[i+1],
        b:imageData[i+2],
        a:imageData[i+3]
    };
    // reset x and increment y when moving to next row
    // otherwise just increment x
    if(x === width - 1) {
        x = 0;
        y++;
    }else{
        x++;
    };
};
console.log(Date.now() - start);*/

};
