(function() {
    var frameContainer = document.getElementById('images'),
        groups = document.getElementsByClassName('group'),
        imageFileInput = document.getElementById('imageFile'),
        jsonFileInput = document.getElementById('jsonFile'),
        nextFrameNumber = 0,
        toolbarButtons = document.querySelectorAll('[data-fn]'),

    addImage = function(src, headerText) {
        // create a new hidden img element and insert into container
        var img = document.createElement('img');
        img.style.display = 'none';
        img.onload = function() {
            // create a new canvas element and insert into container
            var context = createFrame(headerText || 'source image'),
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

    createFrame = function(headerText, params) {
        var canvas = document.createElement('canvas'),
            close = document.createElement('span'),
            div = document.createElement('div'),
            frameButtons = document.createElement('div'),
            header = document.createElement('h4'),
            radio = document.createElement('input'),
            title = document.createElement('span'),
            keys = Object.keys(params || {}),
            titleText = '';
        // write the header
        titleText = '(' + nextFrameNumber + ') ' + headerText;
        if(keys.length !== 0) titleText += '<br>using ';
        for(var i = 0; i < keys.length; i++) {
            titleText += keys[i] + ': ' + params[keys[i]];
            if(i !== keys.length - 1) titleText += ', ';
        };
        title.innerHTML = titleText;
        radio.name = 'sourceFrame';
        radio.type = 'radio';
        radio.value = nextFrameNumber;
        radio.checked = true;
        close.textContent = 'x';
        close.className = 'close';
        close.addEventListener('click', removeFrame);
        frameButtons.appendChild(radio);
        frameButtons.appendChild(close);
        frameButtons.className = 'frameButtons';
        header.appendChild(title);
        header.appendChild(frameButtons);
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
            addImage(reader.result);
        };
        reader.readAsDataURL(file);
    },

    loadPage = function(event) {
        // read the file that was chosen
        var frameData,
            file = event.target.files[0],
            reader = new FileReader();
        reader.onload = function() {
            frameData = JSON.parse(reader.result);
            for(var i = 0; i < frameData.length; i++) {
                addImage(frameData[i].url, frameData[i].text);
            };
        };
        reader.readAsText(file);
    },

    savePage = function() {
        var frameData = [],
            frames = frameContainer.children,
            link = document.createElement('a');

        // get all the images as data urls
        for(var i = 0; i < frames.length; i++) {
            frameData[i] = {
                url:frames[i].lastChild.toDataURL('image/png'),
                text:frames[i].firstChild.firstChild.textContent.slice(4)
            };
        };

        // create a download link for the json file
        link.href = 'data:text/plain;,' + JSON.stringify(frameData);
        link.target = '_blank';
        link.download = 'myProcessedImages.json';
        link.style.display = 'none';

        // insert the link into the document so that it is clickable
        frameContainer.appendChild(link);
        link.click();
        frameContainer.removeChild(link);
    },

    toolbarButtonHandler = function(event) {
        var fn = event.target.getAttribute('data-fn');
        switch(fn) {
            case 'loadTestImage':addImage('cameraman.png'); break;
            case 'loadUserImage':imageFileInput.click(); break;
            case 'savePage':savePage(); break;
            case 'openPage':jsonFileInput.click(); break;
            case 'inspect':
                var sourceFrameNumber = document.querySelector('input[name="sourceFrame"]:checked').value;
                frameContainer.appendChild(imProcess.inspect(document.getElementById('frame'+sourceFrameNumber).getContext('2d')));
                break;
            default:
                var formData = helper.serialize(event.target.parentElement),
                    sourceFrameNumber = document.querySelector('input[name="sourceFrame"]:checked').value,
                    sourceContext = document.getElementById('frame'+sourceFrameNumber).getContext('2d'),
                    targetContext = createFrame(prompt('Please enter the title for the frame.'), formData);
                imProcess.prepare(sourceContext, targetContext);
                imProcess[fn].apply(imProcess, helper.values(formData));
        };
    },

    removeFrame = function(event) {
        var frameElement = event.target.parentElement.parentElement.parentElement;
        if(event.target.previousSibling.checked && frameElement.previousElementSibling) {
            frameElement.previousElementSibling.querySelector('input[name="sourceFrame"]').checked = true;
        };
        frameContainer.removeChild(frameElement);
    };

    // add click event listeners for toolbar navigation
    for(var i = 0, ilen = groups.length; i < ilen; i++) {
        groups[i].addEventListener('click', function(event) {
            var options = event.target.nextElementSibling;
            if(options.className.indexOf('open') !== -1) {
                helper.removeClass(options, 'open');
            }else{
                var open = document.getElementsByClassName('open')[0];
                if(typeof open !== 'undefined') {
                    helper.removeClass(open, 'open');
                };
                options.className += ' open';
            };
        });
    };

    // add click event listeners for toolbar button presses
    for(var i = 0, ilen = toolbarButtons.length; i < ilen; i++) {
        toolbarButtons[i].addEventListener('click', toolbarButtonHandler);
    };

    // add change event listeners for file inputs
    imageFileInput.addEventListener('change', loadImage);
    jsonFileInput.addEventListener('change', loadPage);
    addImage('cameraman.png');
}());
