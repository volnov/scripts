/* global $, jQuery, _ */

// ==UserScript==
// @name         YouTube Live Quotes
// @namespace    youtubelive
// @version      2.0
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
        '.quote-block { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: purple; color: white; display: none; z-index: 200; font-family: "Alice", serif; letter-spacing: 1px; flex-direction: column; align-items: center; }',
        '.quote-block::before { content: ""; display: block; width: 600px; height: 200px; position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 1s; background: purple url("https://n3tman.github.io/scripts/pergament.png") no-repeat center; }',
        '.quote-block button { border: 0; background: transparent; cursor: pointer; padding: 0; font-size: 15px; }',
        '.quote-block ul.texts { padding: 0; margin: 0; }',
        '.quote-block .content { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: calc(100% - 10px); padding: 0; overflow: hidden; z-index: 10; }',
        '.quote-block .author { text-align: center; font-size: 30px; width: 100%; box-sizing: border-box; font-weight: bold; letter-spacing: 5px; border-bottom: 2px solid rgba(255,255,255,0.3); display: none; padding: 3px; border-radius: 10px 10px 0 0; }',
        '.quote-block .tlt { text-align: center; font-size: 32px; line-height: 1; padding: 3px; width: 100%; box-sizing: border-box; list-style-type: none; border-radius: 0 0 10px 10px; opacity: 0; }',
        '.quote-block.active::before { opacity: 1; }',
        '.quote-block.active .author, .quote-block.active .tlt { color: black; border-bottom: none; padding: 0 20px; }',
        '.quote-block.active .content { margin: 21px 0; }',
        '.quote-block .text { list-style-type: none; }',
        '.quote-refresh { position: absolute; bottom: 22px; right: 2px; opacity: 0.1; }',
        '.my-alert { background: linear-gradient(270deg, #ff4a15, #0d480f) !important; background-size: 400% 400% !important; animation: MyAlert 2s ease infinite; }',
        '@keyframes MyAlert { 0% {background-position: 0% 50%} 50% {background-position: 100% 50%} 100% {background-position: 0% 50%} }'
    ].join('\n');
    GM_addStyle(css);
})();

window.$ = window.jQuery = jQuery.noConflict(true);

// ----------------------------------- //

var waitTime = 10 * 60;
var showTime = 60;
var notifyTime = 40;
var lastMessages = 10;

// ----------------------------------- //

var phraseArray = [];
var interval;
var timeout;
var count;
var notified = false;

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

function updateQuote(phrase, notify) {
    var $block = $('.quote-block');
    var $author = $block.find('.author');
    var $tlt = $block.find('.tlt');
    var $texts = $tlt.find('.texts');
    var $counter = $('.quote-counter');

    if (notify) {
        $tlt.find('span:first').hide();
        $texts.show();
    }

    if (timeout) {
        clearTimeout(timeout);
    }

    $author.text(phrase.author).fadeIn('slow');
    $tlt.find('.text').html(phrase.text);
    $tlt.fadeTo('slow', 1);

    if (!notify) {
        $block.addClass('active');
        $author.removeClass('my-alert');
        $tlt.removeClass('my-alert');
        $counter.removeClass('my-alert');

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
    } else {
        lampSound.play();

        $block.removeClass('active');
        $author.addClass('my-alert');
        $tlt.addClass('my-alert');
        $counter.addClass('my-alert');

        timeout = setTimeout(function() {
            $author.fadeOut('slow');
            $tlt.fadeTo('slow', 0, function () {
                $texts.hide();
                $tlt.find('span:first').show();
            });
        }, (notifyTime - 1) * 1000);
    }
}

function getRandomIndex(max) {
    return Math.floor(Math.random() * max);
}

function getRandomArrayValue(arr) {
    var lastArray = _.takeRight(arr, lastMessages);
    return lastArray[getRandomIndex(lastArray.length)];
}

function bindArrive() {
    document.arrive('yt-live-chat-text-message-renderer', function() {
        var $this = $(this);
        var author = $this.find('#author-name').text().trim();
        var message = $this.find('#message').text().trim();
        if (author && message.length > 10 && message.split(' ').length > 1) {
            phraseArray.push({author: author, text: message});
        }
    });
}

$(function () {
    var quoteBlock = '<div class="quote-block"><div class="content"><div class="author"></div>' +
        '<div class="tlt"><ul class="texts"><li class="text"></li></ul></div></div>' +
        '<button class="quote-refresh" title="Обновить">🔄</button>' +
        '</div>';
    $(quoteBlock).appendTo('body');

    var $topMessages = $('.yt-simple-endpoint.yt-dropdown-menu:eq(0) > .yt-dropdown-menu');
    var $allMessages = $('.yt-simple-endpoint.yt-dropdown-menu:eq(1) > .yt-dropdown-menu');

    setTimeout(function () {
        $allMessages.click();
    }, 500);

    $('<link href="https://fonts.googleapis.com/css?family=Alice&display=swap&subset=cyrillic" rel="stylesheet">').appendTo('head');

    var $block = $('.quote-block');

    $('<button class="quote-button">Цитатник</button>').appendTo('body').click(function () {
        bindArrive();
        count = waitTime;
        var $counter = $('.quote-counter').find('.counter');
        $block.css('display', 'flex');
        interval = setInterval(function () {
            var time = new Date(1000 * count).toISOString().substr(14, 5);
            $counter.text(time);
            count--;

            if (count < notifyTime && !notified) {
                updateQuote({
                    author: 'Скорей!',
                    text: 'Пиши в чате стрима,<br>чтобы попасть сюда<br>(берется случайное сообщение<br>из последних)'
                }, true);
                notified = true;
            }

            if (count < 0) {
                count = waitTime;
                if (phraseArray.length > 0) {
                    updateQuote(getRandomArrayValue(phraseArray));
                }
                notified = false;
                $topMessages.click();
                document.unbindArrive();
                setTimeout(function () {
                    $allMessages.click();
                    bindArrive();
                }, 2000);
            }
        }, 1000);
    });

    $('.quote-refresh').click(function () {
        if (phraseArray.length > 0) {
            updateQuote(getRandomArrayValue(phraseArray));
        }
    });
});
