/* global $, jQuery, _ */

// ==UserScript==
// @name         YouTube Live - Спам Номеров
// @namespace    youtubelive
// @version      1.0
// @description  Quote random phrase from chat
// @author       Nik
// @run-at       document-start
// @match        https://www.youtube.com/live_chat?*is_popout=1*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/textillate/0.4.0/jquery.textillate.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lettering.js/0.7.0/jquery.lettering.min.js
// @resource     animateCSS https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    var animateCSS = GM_getResourceText('animateCSS');
    GM_addStyle(animateCSS);

    var css = [
        '.quote-button { position: absolute; top: 10px; left: 30%; width: 30%; padding: 5px 10px; font-size: 16px; z-index: 100; }',
        '.quote-block { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #262626; color: white; display: none; z-index: 200; font-family: "Alice", serif; letter-spacing: 1px; flex-direction: column; align-items: center; }',
        '.quote-block button { border: 0; padding: 5px; background: transparent; cursor: pointer; font-size: 35px; }',
        '.quote-block ul.texts { padding: 0; margin: 0; }',
        '.quote-block .content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100% - 70px); padding: 0 20px; overflow: hidden; }',
        '.quote-block .title { font-size: 40px; line-height: 40px; font-style: italic; font-weight: bold; color: #fefefe; letter-spacing: 6px; background: #0d480f url("https://n3tman.github.io/scripts/handmade-paper.png"); padding: 10px 20px; border-radius: 5px; }',
        '.quote-block .author { text-align: center; font-size: 50px; font-weight: bold; letter-spacing: 3px; border-bottom: 2px solid rgba(255,255,255,0.3); display: none; background: rgba(126, 70, 15, 0.8) url("https://n3tman.github.io/scripts/handmade-paper.png"); width: 80%; padding: 10px; border-radius: 10px 10px 0 0; }',
        '.quote-block .tlt { text-align: center; font-size: 40px; list-style-type: none; width: 80%; padding: 10px; border-radius: 0 0 10px 10px; background: rgba(126, 70, 15, 0.8) url("https://n3tman.github.io/scripts/handmade-paper.png"); opacity: 0; }',
        '.quote-block .text { list-style-type: none; }',
        '.quote-counter { font-size: 45px; font-style: italic; background: #0d480f url("https://n3tman.github.io/scripts/handmade-paper.png"); padding: 5px 10px 5px 20px; border-radius: 5px; }',
        '.quote-counter .counter { font-weight: bold; margin-left: 5px; width: 120px; display: inline-block; }',
        '.quote-close { position: absolute; top: 3px; right: 0; font-size: 20px; }',
        '.quote-refresh { position: absolute; top: 3px; left: 0; font-size: 20px; }',
        '.my-alert { background: linear-gradient(270deg, #ff4a15, #0d480f) !important; background-size: 400% 400% !important; animation: MyAlert 2s ease infinite; }',
        '@keyframes MyAlert { 0% {background-position: 0% 50%} 50% {background-position: 100% 50%} 100% {background-position: 0% 50%} }'
    ].join('\n');
    GM_addStyle(css);
})();

window.$ = window.jQuery = jQuery.noConflict(true);

// ----------------------------------- //

var waitTime = 3 * 60;
var showTime = 160;

// ----------------------------------- //

var phraseArray = [];
var oldArray = [];
var interval;
var timeout;
var count;

var audioArray = [
    new Audio('https://n3tman.github.io/scripts/message.mp3'),
    new Audio('https://n3tman.github.io/scripts/message_3.mp3'),
    new Audio('https://n3tman.github.io/scripts/message_5.mp3')
];

var lampSound = new Audio('https://n3tman.github.io/scripts/lamp.mp3');

audioArray[0].volume = 0.7;
audioArray[1].volume = 0.7;
audioArray[2].volume = 0.7;
lampSound.volume = 0.3;

function updateQuote(phrase) {
    var $block = $('.quote-block');
    var $author = $block.find('.author');
    var $tlt = $block.find('.tlt');
    var $texts = $tlt.find('.texts');
    var $counter = $('.quote-counter');

    if (timeout) {
        clearTimeout(timeout);
    }

    $author.text(phrase.author).fadeIn('slow');
    $tlt.find('.text').html(phrase.text);
    $tlt.fadeTo('slow', 1);

    $tlt.textillate({
        autoStart: false,
        in: {
            effect: 'rollIn',
            callback: function() {
                timeout = setTimeout(function() {
                    $tlt.textillate('out');
                }, showTime * 1000);
            }
        },
        out: {
            effect: 'hinge',
            callback: function() {
                $author.fadeOut('slow');
                $tlt.fadeTo('slow', 0);
            }
        }
    });
    $tlt.textillate('in');

    audioArray[getRandomIndex(audioArray.length)].play();
}

function getRandomIndex(max) {
    return Math.floor(Math.random() * max);
}

function getRandomArrayValue(arr) {
    return arr[getRandomIndex(arr.length)];
}

function bindArrive() {
    document.arrive('yt-live-chat-text-message-renderer', function() {
        var $this = $(this);
        var author = $this.find('#author-name').text().trim();
        var message = $this.find('#message').text().trim();
        if (author && /\d{4,}/g.test(message)) {
            phraseArray.push({author: author, text: message});
        }
    });
}

$(function () {
    var quoteBlock = '<div class="quote-block"><div class="title">НОМЕР ИЗ ЧАТА</div><div class="content"><div class="author"></div>' +
        '<div class="tlt"><ul class="texts"><li class="text"></li></ul></div></div>' +
        '<button class="quote-close" title="Закрыть">❌</button><button class="quote-refresh" title="Обновить">🔄</button>' +
        '<div class="quote-counter my-alert">Новый через <span class="counter">10:00</span></div></div>';
    $(quoteBlock).appendTo('body');

    var $topMessages = $('.yt-simple-endpoint.yt-dropdown-menu:eq(0) > .yt-dropdown-menu');
    var $allMessages = $('.yt-simple-endpoint.yt-dropdown-menu:eq(1) > .yt-dropdown-menu');

    setTimeout(function () {
        $allMessages.click();
    }, 500);

    $('<link href="https://fonts.googleapis.com/css?family=Alice&display=swap&subset=cyrillic" rel="stylesheet">').appendTo('head');

    var $block = $('.quote-block');

    $('<button class="quote-button">Случайный номер</button>').appendTo('body').click(function () {
        bindArrive();
        count = waitTime;
        var $counter = $('.quote-counter').find('.counter');
        $block.css('display', 'flex');
        interval = setInterval(function () {
            var time = new Date(1000 * count).toISOString().substr(14, 5);
            $counter.text(time);
            count--;

            if (count < 0) {
                count = waitTime;
                if (phraseArray.length > 0) {
                    updateQuote(getRandomArrayValue(phraseArray));
                    oldArray = phraseArray;
                    phraseArray = [];
                }
                $topMessages.click();
                document.unbindArrive();
                setTimeout(function () {
                    $allMessages.click();
                    bindArrive();
                }, 2000);
            }
        }, 1000);
    });

    $('.quote-close').click(function () {
        $block.fadeOut();
        $block.find('.author').text('');
        $block.find('.text').text('');
        clearInterval(interval);
        oldArray = [];
        phraseArray = [];
    });

    $('.quote-refresh').click(function () {
        if (oldArray.length > 0) {
            updateQuote(getRandomArrayValue(oldArray));
        }
    });
});
