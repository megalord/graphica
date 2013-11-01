(function() {
    var baseCtx, height, width,
        frameContainer = document.getElementById('images'),

    loadImage = function(event) {
        // read the file that was chosen
        var file = event.target.files[0],
            reader = new FileReader();
        reader.onload = function() {
            // create a new hidden img element and insert into container
            var fragment = document.createDocumentFragment(),
                img = document.createElement('img');
            img.style.display = 'none';
            fragment.appendChild(document.createElement('br'));
            fragment.appendChild(img);
            img.onload = function() {
                // create a new canvas element and insert into container
                var c = document.createElement('canvas');
                baseCtx = c.getContext('2d');
                height = img.height;
                width = img.width;
                c.id = 'baseImageCanvas';
                fragment.appendChild(c);
                // assign canvas dimensions based on image dimensions
                // maximum canvas dimensions are 300x300
                if(height > 300) {
                    height = 300;
                };
                if(width > 300) {
                    width = 300;
                };
                c.height = height;
                c.width = width;
                // draw the image on the canvas
                baseCtx.drawImage(img, 0, 0, width, height);
                document.getElementById('baseImageContainer').appendChild(fragment);
                initToolbar();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    },

    createFrame = function(operation, sourceFrameNumber) {
        var c = document.createElement('canvas'),
            div = document.createElement('div'),
            h = document.createElement('h4'),
            frameNumber = document.getElementsByClassName('frame').length+1;
        // write the header
        h.textContent = ['(', frameNumber, ')   Applied ', operation, ' to frame ', sourceFrameNumber].join('');
        // configure the canvas
        c.id = 'frame'+frameNumber;
        c.className = 'frame';
        c.height = height;
        c.width = width;
        // construct the node tree and insert into DOM
        div.appendChild(h);
        div.appendChild(c);
        frameContainer.appendChild(div);
        return c.getContext('2d');
    },

    initToolbar = function() {
        imp.config(width, height);
        document.getElementById('quantize').addEventListener('click', function() {
            var frameCtx = createFrame('quantization', 1),
                levels = document.getElementById('quantizeLevels').value;
            imp.prepare(baseCtx, frameCtx);
            imp.quantize('linear', levels);
        });
        document.getElementById('noise').addEventListener('click', function() {
            var mu = document.getElementById('mu').value,
                sigma = document.getElementById('sigma').value;
            imp.gaussianNoise(mu, sigma);
        });
        document.getElementById('histogram').addEventListener('click', function() {
            var frameCtx = createFrame('histogram', 1);
            imp.prepare(baseCtx, frameCtx);
            imp.histogram();
        });
    };

    var groups = document.getElementsByClassName('group');
    for(var i = 0, ilen = groups.length; i < ilen; i++) {
        (function(group) {
            group.addEventListener('click', function() {
                console.log(group+' clicked');
                group.className += ' closed';
            });
        }(groups[i]));
    };

    document.getElementById('selectedFile').addEventListener('change', loadImage);
}());
