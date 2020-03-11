(function(exports){

    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'],
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    exports.FormatDate = function(dateObj) {
        var day = dateObj.getDate();
        var hrs = dateObj.getHours();
        var mins = dateObj.getMinutes();
        if(day < 10) day = '0' + day;
        if(hrs < 10) hrs = '0' + hrs;
        if(mins < 10) mins = '0' + mins;
        return days[dateObj.getDay()] + ' ' + months[dateObj.getMonth()] + ' ' + day + ' ' + dateObj.getFullYear() + ', ' + hrs + ':' + mins;
    };

})(typeof exports === 'undefined' ? this['SuppFuncs'] = {} : exports);