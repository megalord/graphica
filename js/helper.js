var helper = {

    addClass:function(element, classToAdd) {
        element.className += (element.className !== '' ? '' : ' ') + classToAdd;
    },

    removeClass:function(element, classToRemove) {
        var classStr = element.className,
            i = classStr.indexOf(classToRemove);
        if(i !== -1) {
            if(classStr.charAt(i-1) === ' ') {
                i--;
            };
            element.className = classStr.slice(0, i) + classStr.slice(i + classToRemove.length+1);
        };
    },

    serialize:function(formElement) {
        // does not work for checkboxes
        // does not parse numbers that are not in a number input
        var name, value,
            formData = {},
            elements = formElement.elements;
        if(typeof elements === 'undefined') {
            return formData;
        };
        for(var i = 0, ilen = elements.length; i < ilen; i++) {
            name = elements[i].name;
            value = elements[i].value;
            switch(elements[i].type) {
                case 'button': break;
                case 'number': formData[name] = parseInt(value); console.log('parsing'); break;
                case 'radio': if(elements[i].checked) formData[name] = value; break;
                default: 
                    if(!isNaN(value)) value = (value.indexOf('.') === -1) ? parseInt(value) : parseFloat(value);
                    formData[name] = value;
            };
        };
        return formData;
    },

    values:function(obj) {
        var keys = Object.keys(obj),
            vals = [];
        for(var i = 0; i < keys.length; i++) {
            vals.push(obj[keys[i]]);
        };
        return vals;
    }

};
