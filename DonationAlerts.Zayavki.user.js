// ==UserScript==
// @name         DonationAlerts Zayavki
// @namespace    arsenalgrinch
// @version      0.5
// @description  Improve and scroll last donations
// @author       Nik
// @run-at       document-start
// @match        https://www.donationalerts.com/widget/lastdonations*
// @match        https://www.donationalerts.ru/widget/lastdonations*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// ==/UserScript==

var itemClass = '.b-last-events-widget__item',
    scrollSeconds = 15,
    currentOffset,
    container = '.scroll-container',
    scroller;

(function() {
    var css = [
        "html, body {",
        "    font-size: 14px;",
        "}",
        ".message-container, .return-to-top, .action-buttons-container {",
        "    display: none !important;",
        "}",
        ".b-last-events-widget__item--inner {",
        "    padding: .5rem .5rem .5rem 1rem;",
        "}",
        ".b-last-events-widget__item--date {",
        "    top: .45rem; right: 1em;",
        "    padding-top: 0; color: #b0b0b0;",
        "}",
        ".b-last-events-widget__item {",
        "    margin-bottom: 0;",
        "    cursor: pointer;",
        "    transition: opacity .5s, box-shadow .5s;",
        "}",
        ".b-last-events-widget__item.past {",
        "    opacity: .25; background-color: black;",
        "}",
        ".b-last-events-widget__item:hover {",
        "    background-color: #072907;",
        "}",
        ".b-last-events-widget__item.current .b-last-events-widget__item--inner {",
        "    box-shadow: 0px 0px 7px green, 0px 0px 7px green; background-color: #072907;",
        "}",
        ".b-last-events-widget__item--from._da {",
        "    background: linear-gradient(to bottom, #838383 0%, #262626 100%);",
        "    font-size: 1.5rem; font-weight: 500; color: white;",
        "}",
        ".b-last-events-widget__item.current ._da {",
        "    background: linear-gradient(to bottom, #83bb83 0%, #266626 100%);",
        "    border-radius: 10px 0 0 10px;",
        "}",
        ".lastevents-container .scroll-container {",
        "    height: calc(100% - 3.5rem);",
        "    overflow-y: scroll;",
        "}",
        ".summary {",
        "    font-size: 1.5em; color: #b0b0b0;",
        "    padding: 0 1rem 0 3.9rem;",
        "    display: flex; align-items: center;",
        "    height: 3.5rem;",
        "    background: linear-gradient(to bottom, #1d1d1d 10%, #353535 70%);",
        "    border-bottom: 1px solid #6d6d6d;",
        "}",
        ".summary > .value {",
        "    font-weight: 500; color: white;",
        "    padding-left: .5rem;",
        "}"
    ].join("\n");
    if (typeof GM_addStyle != 'undefined') {
        GM_addStyle(css);
    } else if (typeof PRO_addStyle != 'undefined') {
        PRO_addStyle(css);
    } else if (typeof addStyle != 'undefined') {
        addStyle(css);
    } else {
        var node = document.createElement('style');
        node.type = 'text/css';
        node.appendChild(document.createTextNode(css));
        var heads = document.getElementsByTagName('head');
        if (heads.length > 0) {
            heads[0].appendChild(node);
        } else {
            // no head yet, stick it whereever
            document.documentElement.appendChild(node);
        }
    }}
)();

window.$ = window.jQuery = jQuery.noConflict(true);

function addNumbers() {
    var $currentItems,
        remaining;
    $(itemClass).find('._da').text('');
    $currentItems = $(itemClass + ':not(.past):not(.current)');
    remaining = $currentItems.length;
    $currentItems.each(function (i, val) {
        $(val).find('._da').text(remaining - i);
    });
    $('.summary > .value').text(remaining);
}

function addClickEvent($items) {
    $items.click(function() {
        var $item = $(this),
            dateTime = $item.find('#date_created').val();
        $(itemClass).removeClass('current past');
        $item.addClass('current').nextAll().addClass('past');
        addNumbers();
        localStorage.setItem('lastDonat', dateTime);
    });
}

function refreshData() {
    $('.b-last-events-widget__item--title').html(function(i, val) {
        return val.replace('отправил','→');
    });

    addNumbers();
}

function scrollToCurrent(element) {
    currentOffset = $('.current').position().top;
    $('.scroll-container').animate({
        scrollTop: currentOffset - 3 * $(itemClass).height()
    }, scrollSeconds * 1000);
}

function scrollToTop(element) {
    $(element).animate({
        scrollTop: 0
    }, scrollSeconds * 1000);
}

function startScroll(element) {
    var flag = 0;
    if ($('.current').length) {
        scrollToCurrent(element);
        scroller = setInterval(function() {
            if (flag) {
                scrollToCurrent(element);
                flag = 0;
            } else {
                scrollToTop(element);
                flag = 1;
            }
        }, scrollSeconds * 1000);
    }
}

$(function () {
    var donatTime;

    $(container).before(
        '<div class="summary"><span class="title">Заявок в очереди:</span> <span class="value">0</span></div>'
    );

    refreshData();

    addClickEvent($(itemClass));

    donatTime = localStorage.getItem('lastDonat');
    if (donatTime) {
        $('input[value="' + donatTime + '"]').next().click();
    }

    unsafeWindow.lascroll.destroy();

    startScroll(container);
    $(container).hover(function() {
        clearInterval(scroller);
        $(container).stop();
    }, function() {
        startScroll(container);
    });
});

$(document).arrive(itemClass, function() {
    var $newElem = $(this);
    refreshData();
    addClickEvent($newElem);
});