(function() {
    var fileInput = document.getElementById('selectedFile'),
        frameContainer = document.getElementById('images'),
        groups = document.getElementsByClassName('group'),
        nextFrameNumber = 0,
        toolbarButtons = document.querySelectorAll('#toolbar .button');

    addBaseImage = function(src) {
        // create a new hidden img element and insert into container
        var img = document.createElement('img');
        img.style.display = 'none';
        img.onload = function() {
            // create a new canvas element and insert into container
            var context = createFrame('source image'),
                width = img.width,
                height = img.height;
            // for better visibility, scale large images to 300x300
            if(height > 300) {
                height = 300;
            };
            if(width > 300) {
                width = 300;
            };
            // draw the image on the canvas
            context.canvas.width = width;
            context.canvas.height = height;
            context.drawImage(img, 0, 0, width, height);
        };
        img.src = src;
    },

    createFrame = function(headerText) {
        var canvas = document.createElement('canvas'),
            close = document.createElement('span'),
            div = document.createElement('div'),
            header = document.createElement('h4'),
            radio = document.createElement('input'),
            title = document.createElement('span');
        // write the header
        title.textContent = '(' + nextFrameNumber + ') ' + headerText;
        radio.name = 'sourceFrame';
        radio.type = 'radio';
        radio.value = nextFrameNumber
        radio.checked = true;
        close.textContent = 'x';
        header.appendChild(title);
        header.appendChild(radio);
        header.appendChild(close);
        // configure the canvas
        canvas.id = 'frame' + nextFrameNumber;
        canvas.className = 'frame';
        nextFrameNumber++;
        // construct the node tree and insert into DOM
        div.appendChild(header);
        div.appendChild(canvas);
        frameContainer.appendChild(div);
        return canvas.getContext('2d');
    },

    loadImage = function(event) {
        // read the file that was chosen
        var file = event.target.files[0],
            reader = new FileReader();
        reader.onload = function() {
            addBaseImage(reader.result);
        };
        reader.readAsDataURL(file);
    },
    
    removeClass = function(element, classToRemove) {
        var classStr = element.className,
            i = classStr.indexOf(classToRemove);
        if(i !== -1) {
            if(classStr.charAt(i-1) === ' ') {
                i--;
            };
            element.className = classStr.slice(0, i) + classStr.slice(i + classToRemove.length+1);
        };
    },

    toolbarButtonHandler = function(event) {
        var fn = event.target.getAttribute('data-fn');
        if(fn.slice(0, 4) !== 'load') {
            var newFrame = document.querySelector('input[name="newFrame"]:checked').value,
                sourceFrameNumber = document.querySelector('input[name="sourceFrame"]:checked').value,
                sourceContext = document.getElementById('frame'+sourceFrameNumber).getContext('2d'),
                targetContext = (newFrame === 'true') ? createFrame('quantization') : sourceContext;
            imp.prepare(sourceContext, targetContext);
        };
        switch(fn) {
            case 'gaussianNoise':
                var mu = document.getElementById('mu').value,
                    sigma = document.getElementById('sigma').value;
                imp.gaussianNoise(mu, sigma);
                break;
            case 'filter':
                var centerX = parseInt(document.getElementById('centerX').value),
                    centerY = parseInt(document.getElementById('centerY').value),
                    mask = JSON.parse(document.getElementById('mask').value),
                    scale = parseInt(document.getElementById('scale').value);
                // [[-1, 0], [0, 1]]
                // [[-1, 2, -1], [0, 0, 0], [1, 2, 1]]
                imp.filter(scale, mask, centerX, centerY);
                break;
            case 'histogram':
                imp.histogram();
                break;
            case 'inspect':
                var cell, row,
                    table = document.createElement('table'),
                    tableBody = document.createElement('tbody');
                imp.read();
                imp.loopPixels(function(x, y, i) {
                    if(x === imp.width - 1) {
                        if(y < imp.height - 2) {
                            tableBody.insertBefore(row, tableBody.firstChild);
                        }else if(y === imp.height - 2) {
                            tableBody.appendChild(row);
                        };
                        row = document.createElement('tr');
                    };
                    cell = document.createElement('td');
                    cell.textContent = i;
                    cell.title = x+', '+y;
                    if(x === imp.width - 1) {
                        row.appendChild(cell);
                    }else{
                        row.insertBefore(cell, row.firstChild);
                    };
                });
                table.appendChild(tableBody);
                table.id = 'frame' + nextFrameNumber;
                table.className = 'frame';
                nextFrameNumber++;
                table.style.width = '300px';
                table.style.height = '300px';
                table.style.overflow = 'scroll';
                frameContainer.appendChild(table);
                break;
            case 'loadTestImage':
                addBaseImage('cameraman.png');
                break;
            case 'loadUserImage':
                fileInput.click();
                break;
            case 'quantize':
                var levels = document.getElementById('quantizeLevels').value;
                imp.quantize('linear', levels);
                break;
        };
    };

    // add click event listeners for toolbar navigation
    for(var i = 0, ilen = groups.length; i < ilen; i++) {
        groups[i].addEventListener('click', function(event) {
            var options = event.target.nextElementSibling;
            if(options.className.indexOf('open') !== -1) {
                removeClass(options, 'open');
            }else{
                var open = document.getElementsByClassName('open')[0];
                if(typeof open !== 'undefined') {
                    removeClass(open, 'open');
                };
                options.className += ' open';
            };
        });
    };

    // add click event listeners for toolbar button presses
    for(var i = 0, ilen = toolbarButtons.length; i < ilen; i++) {
        toolbarButtons[i].addEventListener('click', toolbarButtonHandler);
    };

    // add change event listener for file upload input
    fileInput.addEventListener('change', loadImage);
}());
