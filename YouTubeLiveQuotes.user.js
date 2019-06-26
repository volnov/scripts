// ==UserScript==
// @name         YouTube Live Quotes
// @namespace    youtubelive
// @version      0.8
// @description  Quote random phrase from chat
// @author       Nik
// @run-at       document-start
// @match        https://www.youtube.com/live_chat?*is_popout=1*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/arrive/2.4.1/arrive.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/lettering.js/0.7.0/jquery.lettering.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/textillate/0.4.0/jquery.textillate.min.js
// @resource     animateCSS https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function() {
    var animateCSS = GM_getResourceText('animateCSS');
    GM_addStyle(animateCSS);

    var css = [
        '.quote-button { position: absolute; top: 10px; left: 30%; width: 30%; padding: 5px 10px; font-size: 16px; z-index: 100; }',
        '.quote-block { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #262626; color: white; display: none; z-index: 200; font-family: "Alice", serif; letter-spacing: 1px; background-image: url("https://n3tman.github.io/scripts/handmade-paper.png"); }',
        '.quote-block button { border: 0; padding: 5px; background: transparent; cursor: pointer; }',
        '.quote-block .content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100% - 70px); padding: 0 20px; overflow: hidden; }',
        '.quote-block .title { text-align: center; font-size: 30px; line-height: 40px; font-style: italic; font-weight: bold; background: linear-gradient(to bottom, #1d1d1d 10%, #353535 70%); color: #fefefe; letter-spacing: 6px; border-bottom: 1px solid #d3d3d37d; padding-bottom: 5px; }',
        '.quote-block .author { text-align: center; font-size: 50px; font-weight: bold; padding-bottom: 10px; letter-spacing: 3px; display: none; }',
        '.quote-block .tlt { text-align: center; font-size: 40px; padding-bottom: 10px; list-style-type: none; }',
        '.quote-block .text { list-style-type: none; }',
        '.quote-counter { position: absolute; bottom: 3px; right: 10px; font-size: 30px; }',
        '.quote-close { position: absolute; top: 3px; right: 0; font-size: 20px; }',
        '.quote-refresh { position: absolute; top: 3px; left: 0; font-size: 20px; }'
    ].join('\n');
    GM_addStyle(css);
})();

window.$ = window.jQuery = jQuery.noConflict(true);

var oldPhrases = [];
var newPhrases = [];
var interval;
var timeout;
var waitTime = 10 * 60;
var count;
var showTime = 20;

var audioArray = [
    new Audio('https://static.donationalerts.ru/uploads/sounds/2/message.mp3'),
    new Audio('https://static.donationalerts.ru/uploads/sounds/2/message_3.mp3'),
    new Audio('https://static.donationalerts.ru/uploads/sounds/2/message_5.mp3')
];

function updateQuote(phrase) {
    var $block = $('.quote-block');
    var $author = $block.find('.author');
    var $tlt = $block.find('.tlt');
    $author.text(phrase.author).fadeIn('slow');
    $tlt.find('.text').text(phrase.text);

    if (timeout) {
        clearTimeout(timeout);
    }

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
    var val = arr[getRandomIndex(arr.length)];
    if (val.text.length > 10 && val.text.split(' ').length > 1) {
        return val;
    } else {
        return getRandomArrayValue(arr);
    }
}

$(function () {
    var quoteBlock = '<div class="quote-block"><div class="title">ЦИТАТЫ ВЕЛИКИХ</div><div class="content"><div class="author"></div>' +
        '<div class="tlt"><ul class="texts"><li class="text"></li></ul></div></div>' +
        '<button class="quote-close" title="Закрыть">❌</button><button class="quote-refresh" title="Обновить">🔄</button><div class="quote-counter"></div></div>'
    $(quoteBlock).appendTo('body');

    $('<link href="https://fonts.googleapis.com/css?family=Alice&display=swap&subset=cyrillic" rel="stylesheet">').appendTo('head');

    var $block = $('.quote-block');

    $('<button class="quote-button">Цитатник</button>').appendTo('body').click(function () {
        count = waitTime;
        var $counter = $('.quote-counter');
        $block.fadeIn();
        interval = setInterval(function () {
            var time = new Date(1000 * count).toISOString().substr(14, 5);
            $counter.text(time);
            count--;

            if (count < 0) {
                count = waitTime;
                if (newPhrases.length) {
                    oldPhrases = newPhrases;
                    newPhrases = [];
                }
                updateQuote(getRandomArrayValue(oldPhrases));
            }
        }, 1000);
    });

    $('.quote-close').click(function () {
        $block.fadeOut();
        $block.find('.author').text('');
        $block.find('.text').text('');
        clearInterval(interval);
    });

    $('.quote-refresh').click(function () {
        if (oldPhrases.length) {
            updateQuote(getRandomArrayValue(oldPhrases));
        } else {
            updateQuote(getRandomArrayValue(newPhrases));
        }
    });
});

$(document).arrive('yt-live-chat-text-message-renderer', function() {
    var $this = $(this);
    var author = $this.find('#author-name').text().trim();
    var message = $this.find('#message').text().trim();
    if (count < 15) {
        newPhrases.push({author: author, text: message});
    }
});
