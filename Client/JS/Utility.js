var Utility = {
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
    }
}

window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber
    + ' Column: ' + column + ' StackTrace: ' + errorObj);
}