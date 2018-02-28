(function($, window, undefined){
    window.iTools = {
        /* 动画(animate.css) */
        /**
            参数说明:
                elem - 要闪烁的元素jQuery对象
                effect - 效果名称(参考animate.css)
            常用动画参考:
                fadeIn
                bounceIn
                fadeInDown
                fadeInLeft
                fadeInRight
                flipInX
        */
        animate: function(elem, effect, callback){
            elem.addClass('animate-control').addClass('animated '+effect);

            // 部分浏览器可能暂时不能很好支持这些事件
            elem.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',function(){
                elem.removeClass('animated '+effect).removeClass('animate-control');
                if (typeof callback === 'function'){
                    callback.call(elem);
                }
            });
        },
        /**
            参数说明:
                loadHandle - 触发时的处理函数
        */
        scrollLoad: function(loadHandle){
            $(window).scroll(function (){
                var windowHeight = $(window).height();  //页面可视区域高度
                var pageHeight = $(document).height();
                var scrollTop = $(window).scrollTop();
                if (pageHeight - windowHeight - scrollTop <= 50){
                    loadHandle();
                }
            });
        },
        /* 计时器 */
        /**
            参数说明:
                option - 选项
        */
        timer: function(option){
            var Timer = function (option) {
                this.init(option);
            };
            Timer.prototype = {
                init: function(option){
                    this.option = option;
                    this.$elem = $(option.container);

                    var itemText = '\
                        <span class="timer-hours">00</span>\
                        <span class="timer-colon">:</span>\
                        <span class="timer-minutes">00</span>\
                        <span class="timer-colon">:</span>\
                        <span class="timer-seconds">00</span>\
                    ';
                    this.$elem.addClass('timer').html(itemText)
                        .css({
                            'font-size': option.size+'px',
                            'color': option.color
                        });;

                    this.$elem.node = {
                        hours: this.$elem.find('.timer-hours'),
                        minutes: this.$elem.find('.timer-minutes'),
                        seconds: this.$elem.find('.timer-seconds'),
                        colon: this.$elem.find('.timer-colon')
                    }
                    this.counter = 0;
                },
                start: function(){
                    var self = this;
                        console.info(this);
                        //console.info(this.walking);
                    if (!this.walking){
                        this.walking = setInterval(function(){
                            var remain = ++self.counter;
                            var hours,minutes,seconds;
                            hours = Math.floor(remain / 3600);
                            remain = remain % 3600;
                            minutes = Math.floor(remain / 60);
                            remain = remain % 60;
                            seconds = Math.floor(remain / 1);

                            //console.info(hours+':'+minutes+':'+seconds);

                            self.$elem.node.hours.html(function(){
                                return hours === 0 ? '00' : hours;
                            });
                            self.$elem.node.minutes.html(function(){
                                return minutes < 10 ? '0'+minutes : minutes;
                            });
                            self.$elem.node.seconds.html(function(){
                                return seconds < 10 ? '0'+seconds : seconds;
                            });
                        },1000);
                    }
                },
                stop: function(){
                    clearInterval(this.walking);
                    delete this.walking;
                },
                reset: function(){
                    this.stop();
                    this.counter = 0;
                    this.$elem.children(':not(.timer-colon)').html('00');
                }
            };
            // 选项默认值
            var defaults = {
                container: null,
                size: 20,
                color: '#00B5E5'
            };
            var option = $.extend(defaults, option || {});
            if (typeof option === 'object'){
                return new Timer(option);
            }
        },
        /* Block堆叠效果 */
        /**
            参数说明:
                option >>
                    container - 堆叠目标容器
                    formater - 堆叠数据格式化函数
                    delay - 堆叠时间间隔
                    effect - 堆叠效果名称
        */
        stacker: function(option){
            var iTools = this;
            var Stacker = function (option) {
                this.queue = new Array();
                this.option = option;
            };
            Stacker.prototype = {
                /*
                    参数说明:
                        data - 堆叠数据
                        callback - 每个block生成后的处理函数
                */
                start: function(data, callback){
                    var self = this;
                    var opts = this.option;
                    var interval = 0;
                    $.each(data, function(i, n){
                        self.queue[i] = setTimeout(function(){
                            var $thisItem = $(opts.formater(n)).appendTo(opts.container);
                            
                            // 使用动画控制工具或者直接使用CSS控制 -> $thisItem.addClass('animated '+opts.effect);
                            iTools.animate($thisItem, opts.effect);

                            if (typeof callback === 'function'){
                                var info = {
                                    elem: $thisItem,
                                    data: n,
                                    index: i+1,
                                    length: data.length
                                }
                                callback(info);
                            }
                        },interval);
                        interval += opts.delay;
                    });
                },
                stop: function(){
                    if (this.queue != 0){ // 判断数组是否为空，可以与0或false比较，也可以看length属性
                        $.each(this.queue, function(i, n){
                            clearTimeout(n);
                        });
                    }
                },
                clear: function(){
                    this.stop();
                    $(this.option.container).html('');
                }
            };
            // 选项默认值
            var defaults = {
                container: null,
                formater: null,
                delay: 100,
                effect: 'fadeIn'
            };
            var option = $.extend(defaults, option || {});
            return new Stacker(option);
        },
        loader: function(option){
            var iTools = this;
            var Loader = function (option){
                this.init(option);
            };
            Loader.prototype = {
                init: function(option){
                    this.queue = new Array();
                    this.option = option;
                    this.pager = {
                        loadLock: false,
                        page: 0
                    };
                    this.stacker = iTools.stacker({
                        container: option.container,
                        formater: option.formater,
                        delay: option.delay,
                        effect: option.effect,
                        effectSpeed: option.effectSpeed
                    });
                    this.spinner = '\
                        <div class="spinner">\
                            <div class="bounce1"></div>\
                            <div class="bounce2"></div>\
                            <div class="bounce3"></div>\
                        </div>\
                    ';

                    this.option.container = $(this.option.container);
                    
                    var tableGroup = ['TABLE','TBODY','TBODY','TFOOT'];
                    
                    if ($.inArray(option.container.get(0).nodeName, tableGroup) === -1){
                        this.spinner = '\
                            <div class="spinner-wrapper">\
                                '+this.spinner+'\
                            </div>\
                        ';
                        
                        this.option.noDataSign = '\
                            <div class="sign-wrapper">\
                                '+this.option.noDataSign+'\
                            </div>\
                        ';
                        
                        this.option.noMoreSign = '\
                            <div class="sign-wrapper">\
                                '+this.option.noMoreSign+'\
                            </div>\
                        ';
                    }else{
                        this.spinner = '\
                            <tr class="spinner-wrapper">\
                                <td colspan="100">\
                                    '+this.spinner+'\
                                </td>\
                            </tr>\
                        ';
                        
                        this.option.noDataSign = '\
                            <tr class="sign-wrapper">\
                                <td colspan="100">\
                                    '+this.option.noDataSign+'\
                                </td>\
                            </tr>\
                        ';
                        
                        this.option.noMoreSign = '\
                            <tr class="sign-wrapper">\
                                <td colspan="100">\
                                    '+this.option.noMoreSign+'\
                                </td>\
                            </tr>\
                        ';
                    }

                    if (this.option.scrollLoad){
                        this._bindScroll();
                    }
                },
                load: function(data){
                    if (typeof data === 'object'){
                        //$.extend(this.option.data, data);
                        this.option.data = data;
                    }
                    var self = this;
                    var option = this.option;
                    self.pager.loadLock = true;
                    self.pager.page++;
                    console.info('Loader Pager: ', self.pager);

                    option.container.append(self.spinner);
                    
                    $.ajax({
                        type: option.type,
                        url: option.url,
                        data: $.extend({
                            dataPage: self.pager.page,
                            dataRows: option.dataRows
                        }, option.data || {}),
                        cache: option.cache,
                        async: true,
                        dataType: option.dataType,
                        success: function(result){
                            option.beforeStack(result); // 堆叠开始前的回调函数 [给出参数为所有条目的数据]
                            option.container.find('.spinner-wrapper').remove(); // 无论返回结果有无数据首先移除spinner动画
                            if (result != null && !$.isEmptyObject(result)){
                                self.stacker.start(result, function(info){
                                    option.itemComplete(info); // 单个条目输出完成时的回调函数 [给出参数为单个条目的数据以及总数据长度等信息]
                                    if (info.index == info.length){
                                        self.pager.loadLock = false; // 完成后解除锁定
                                        option.allComplete(result); // 所有条目输出完成时的回调函数 [给出参数为所有条目的数据]
                                    }
                                });
                            }else{
                                if (self.pager.page == 1)
                                    option.container.append(option.noDataSign);
                                else{
                                    option.container.append(option.noMoreSign);
                                }
                            }
                        }
                    });
                },
                reset: function(){
                    this.stacker.clear();
                    this.pager = {
                        loadLock: false,
                        page: 0
                    };
                },
                destroy: function(){
                    this._unbindScroll();
                },
                _bindScroll: function(){
                    this.namespace = 'Loader' + Math.random().toString().replace(/\D/g, '');
                    var self = this;
                    $(window).on('scroll.'+self.namespace, function(){
                        var windowHeight = $(window).height();
                        var pageHeight = $(document).height();
                        var scrollTop = $(window).scrollTop();
                        if (pageHeight - windowHeight - scrollTop <= 50 && !self.pager.loadLock && option.scrollLoadControl()){
                            self.load();
                        }
                    });
                },
                _unbindScroll: function(){
                    $(window).off('.'+this.namespace);
                }
            };
            // 选项默认值
            var defaults = {
                container: null,
                formater: null,
                dataRows: undefined,
                type: 'post',
                url: null,
                cache: false,
                beforeStack: function(result){},
                itemComplete: function(info){},
                allComplete: function(result){},
                data: {},
                dataType: 'json',
                delay: 100,
                effect: 'flipInX',
                scrollLoad: true,
                scrollLoadControl: function(){return true},
                noDataSign: '<div class="signbox">无数据</div>',
                noMoreSign: '<div class="signbox">全部加载完了</div>'
            };
            var option = $.extend(defaults, option || {});
            return new Loader(option);
        }
    }
})(jQuery, window);