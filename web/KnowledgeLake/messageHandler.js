"use strict";

function guid() {
    var s4 = () => { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); };
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
var MessageTypes = {
    Handshake: '$isolation.internal.handshake',
    ACK: '$isolation.message.ack',
    Standard: '$isolation.message.standard',
};
var DummyLogger = /** @class */ (function () {
    function DummyLogger() {
    }
    DummyLogger.prototype.log = function (args) { };
    DummyLogger.prototype.error = function (args) { };
    DummyLogger.prototype.warn = function (args) { };
    return DummyLogger;
}());
/**
 * This is exported from this file, and should be used to construct a MessageHandler
 **/
var IsolatedRuntimeMessageHandlerBuilder = /** @class */ (function () {
    function IsolatedRuntimeMessageHandlerBuilder() {
    }
    /**
     * Entry point for a parent
     */
    IsolatedRuntimeMessageHandlerBuilder.prototype.Parent = function (iframe, logger, event) {
        if (logger === void 0 || logger == null) { logger = new DummyLogger(); }
        if (event === void 0) { event = 'load'; }
        var instance = new IsolatedRuntimeMessageHandler(logger);
        iframe.contentWindow.addEventListener(event, function oneTimeHandler() {
            instance.Sender = new MessageSender(iframe.contentWindow, '*');
            instance._sendHandshake();
            //iframe.removeEventListener('load', oneTimeHandler);
        });
        return instance;
    };
    /**
     * Entry point for a child
     */
    IsolatedRuntimeMessageHandlerBuilder.prototype.Child = function (logger) {
        if (logger === void 0) { logger = new DummyLogger(); }
        var instance = new IsolatedRuntimeMessageHandler(logger);
        instance.IsParent = false;
        return instance;
    };
    return IsolatedRuntimeMessageHandlerBuilder;
}());
/**
 * Sends messages to and from an iframe
 */
var IsolatedRuntimeMessageHandler = /** @class */ (function () {
    function IsolatedRuntimeMessageHandler(logger) {
        var _this = this;
        this.IsParent = true;
        this.InstanceId = guid();
        this.Sender = null;
        this._sendQueue = [];
        this._canSend = false;
        this._listeners = {};
        /**
         * Decide what to do when a message is received
         * @param rawMsg
         */
        this._handleReceiveMessage = function (rawMsg) {
            // If not the parent then setup the receiver
            if (!_this.IsParent && _this.Sender == null) {
                _this.Sender = new MessageSender(rawMsg.source, rawMsg.origin);
                _this.InstanceId = rawMsg.data._InstanceId;
            }
            // Make sure the message came from the correct place before receiving
            if (rawMsg.source != _this.Sender.Target)
            return;
            if (!_this.IsParent && rawMsg.origin != _this.Sender.Origin)
            return;
            if (rawMsg.data._InstanceId != _this.InstanceId)
            return;

            _this._logger.log(['%c' + (_this.IsParent ? 'Parent' : 'Child') + ' received a message', 'color:' + (_this.IsParent ? 'orange' : 'blue'), rawMsg.data]);
            try {
                var msg_1 = rawMsg.data;
                switch (msg_1._Type) {
                    case MessageTypes.Handshake:
                        _this._canSend = true;
                        if (_this.IsParent) {
                            _this._logger.log(['%cParent received handshake response', 'color: orange']);
                        }
                        else {
                            // Child received handshake and is now all setup
                            _this._logger.log(['%cChild received handshake', 'color: blue']);
                            _this._sendHandshake();
                        }
                        break;
                    case MessageTypes.ACK:
                        var ackFor = msg_1._MessageId;
                        var index = -1;
                        for (var i = 0; i < _this._sendQueue.length; i++) {
                            if (_this._sendQueue[i].Message._MessageId == ackFor) {
                                index = i;
                                break;
                            }
                        }
                        if (index > -1) {
                            var queuedItem = _this._sendQueue[index];
                            if (msg_1._Success)
                                queuedItem.Resolve(msg_1.Data);
                            else
                                queuedItem.Reject(msg_1.Data);
                            _this._sendQueue.splice(index, 1);
                        }
                        break;
                    case MessageTypes.Standard:
                        var result = [];
                        var callbacks = _this._listeners[msg_1.Data.Type];
                        if (callbacks != undefined) {
                            for (var i = 0; i < callbacks.length; i++) {
                                try {
                                    var tmp = callbacks[i].call(undefined, msg_1.Data.Data);
                                    result.push(window.Promise.resolve(tmp));
                                }
                                catch (e) {
                                    result.push(window.Promise.reject(e));
                                }
                            }
                            window.Promise.all(result)
                                .then(function (results) {
                                if (results.length == 1)
                                    results = results[0];
                                _this._sendACK(msg_1._MessageId, results, true);
                            })
                                .catch(function (e) {
                                _this._sendACK(msg_1._MessageId, e, false);
                            });
                        }
                        else {
                            //console.log((this.IsParent ? 'Parent' : 'Child') + ' Response for Message ' + msg.Data.Type, result);
                            result = undefined;
                            _this._sendACK(msg_1._MessageId, result);
                        }
                        break;
                }
                if (_this._canSend) {
                    //console.log((this.IsParent ? 'Parent' : 'Child') + ' Send Queue', this._sendQueue);
                    // Send next message in the queue
                    if (_this._sendQueue.length == 0)
                        return;
                    var nextToSend = _this._sendQueue[0];
                    if (!nextToSend.Sent) {
                        _this.Sender.Send(nextToSend.Message);
                        nextToSend.Sent = true;
                    }
                }
            }
            catch (e) {
                console.error('Error in IsolatedRuntimeMessageHandler::_handleReceiveMessage', e);
            }
        };
        this._logger = logger;
        window.addEventListener('message', this._handleReceiveMessage);
    }
    /**
     * Sends a message
     * @param msg
     */
    IsolatedRuntimeMessageHandler.prototype.Send = function (type, data) {
        var queuedItem = new QueuedCrossFrameMessage({
            Type: type,
            Data: data
        }, MessageTypes.Standard);

        queuedItem.Message._InstanceId = this.InstanceId;
        this._queueMessage(queuedItem);
        return queuedItem.Promise;
    };
    /**
     * Allows users to subscribe to a message and be able to send data back
     * @param type
     * @param callback Return whatever value you want to send back to the sender
     */
    IsolatedRuntimeMessageHandler.prototype.Listen = function (type, callback) {
        if (this._listeners[type] == undefined) {
            this._listeners[type] = [];
        }
        this._listeners[type].push(callback);
    };
    IsolatedRuntimeMessageHandler.prototype.ClearListeners = function () {
        this._listeners = {};
    };
    /**
     * Sends an acknowledgement that a message was received
     * @param messageId
     */
    IsolatedRuntimeMessageHandler.prototype._sendACK = function (messageId, data, success) {
        if (data === void 0) { data = null; }
        if (success === void 0) { success = true; }
        var ack = new QueuedCrossFrameMessage(data, MessageTypes.ACK, success);
        ack.Message._MessageId = messageId;
        ack.Message._InstanceId = this.InstanceId;
        this.Sender.Send(ack.Message);
        //this._queueMessage(ack);
    };
    IsolatedRuntimeMessageHandler.prototype._sendHandshake = function () {
        var handshake = new QueuedCrossFrameMessage(null, MessageTypes.Handshake);
        handshake.Message._InstanceId = this.InstanceId;
        //this._queueMessage(handshake, true);
        this.Sender.Send(handshake.Message);
        //this._sendQueue.shift();
    };
    IsolatedRuntimeMessageHandler.prototype._queueMessage = function (msg, highPriority) {
        if (highPriority === void 0) { highPriority = false; }
        msg.Message._InstanceId = this.InstanceId;
        if (highPriority)
            this._sendQueue.unshift(msg);
        else
            this._sendQueue.push(msg);

        // If nothing else is in the queue then send the message
        if (this._canSend && this._sendQueue.length == 1 && this.Sender != null && this.Sender.Target != null) {
            this.Sender.Send(msg.Message);
            msg.Sent = true;
        }
    };
    return IsolatedRuntimeMessageHandler;
}());
var MessageSender = /** @class */ (function () {
    function MessageSender(target, origin) {
        this.Origin = '*';
        this.Target = null;
        this.Target = target;
        this.Origin = origin;
    }
    MessageSender.prototype.Send = function (msg) {
        //console.log('Sending ', msg);
        try {
            this.Target.postMessage(msg, this.Origin);
        }
        catch (e) {
            this.Target.postMessage(JSON.parse(JSON.stringify(msg)), this.Origin);
        }
    };
    return MessageSender;
}());
var CrossFrameMessage = /** @class */ (function () {
    function CrossFrameMessage(data, success) {
        if (success === void 0) { success = true; }
        this._Type = MessageTypes.Standard;
        this._InstanceId = null;
        this._MessageId = guid();
        this._Success = true;
        this.Data = null;
        this.Data = data;
        this._Success = success;
    }
    return CrossFrameMessage;
}());
var QueuedCrossFrameMessage = /** @class */ (function () {
    function QueuedCrossFrameMessage(data, messageType, success) {
        if (messageType === void 0) { messageType = MessageTypes.Standard; }
        if (success === void 0) { success = true; }
        var _this = this;
        this.Message = null;
        this.Promise = null;
        this.Resolve = null;
        this.Reject = null;
        this.Sent = false;
        this.Message = new CrossFrameMessage(data, success);
        this.Message._Type = messageType;
        this.Promise = new Promise(function (resolve, reject) {
            _this.Resolve = resolve;
            _this.Reject = reject;
        });
    }
    return QueuedCrossFrameMessage;
}());
var messageHandlerBuilder = new IsolatedRuntimeMessageHandlerBuilder();


exports.messageHandlerBuilder = messageHandlerBuilder;

