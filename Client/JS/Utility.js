var Utility = (() => {

    return {
        html: {
            ElemHideRear: function (elem) {
                elem.style.display = 'none';
                elem.style.zIndex = -1;
            },
            ElemShowMiddle: function (elem) {
                elem.style.display = 'block';
                elem.style.zIndex = 0;
            },
            ElemShowFront: function (elem, zIndex = 1) {
                elem.style.display = 'block';
                elem.style.zIndex = zIndex;
            },
            ElemPos: function(elem) {
                var posX = 0;
                var posY = 0;
            
                while (elem) {
                    if (elem.tagName == "BODY") {
                        // deal with browser quirks with body/window/document and page scroll
                        var xScrollPos = elem.scrollLeft || document.documentElement.scrollLeft;
                        var yScrollPos = elem.scrollTop || document.documentElement.scrollTop;
                    
                        posX += (elem.offsetLeft - xScrollPos + elem.clientLeft);
                        posY += (elem.offsetTop - yScrollPos + elem.clientTop);
                    }
                    else {
                        posX += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
                        posY += (elem.offsetTop - elem.scrollTop + elem.clientTop);
                    }
                
                    elem = elem.offsetParent;
                }
                return {
                    x: posX,
                    y: posY
                };
            },
            FromString: function(string, arrTrue) {
                var template = document.createElement('template');
                if(!arrTrue)
                    string = string.trim();

                template.innerHTML = string;
                return arrTrue ? template.content.children : template.content.firstElementChild;
            }
        }
    }
})();

window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber
    + ' Column: ' + column + ' StackTrace: ' + errorObj);
}