export default class SocketService {
    static instance = null
    static get Instance() {
        if (!this.instance) {
            this.instance = new SocketService()
        }
        return this.instance
    }

    ws = null
    connected = false
    connectRetryCount = 0
    
    // For request-response pattern
    pendingRequests = new Map();
    requestIdCounter = 0; // Simple counter for unique request IDs

    // For broadcast/event-based callbacks
    callBackMapping = {}

    generateRequestId() {
        return `req-${this.requestIdCounter++}`;
    }

    connect() {
        if (!window.WebSocket) {
            return console.log('浏览器不支持websocket');
        }
        this.ws = new WebSocket('ws://localhost:9998')
        this.ws.onopen = () => {
            console.log('服务器连接成功');
            this.connected = true
            this.connectRetryCount = 0
        }
        this.ws.onclose = () => {
            console.log('连接服务器失败');
            this.connected = false
            // Reject all pending requests on close
            this.pendingRequests.forEach(({ reject }) => reject(new Error('WebSocket connection closed.')));
            this.pendingRequests.clear();
            
            this.connectRetryCount++
            setTimeout(() => {
                this.connect()
            }, this.connectRetryCount * 500)
        }
        this.ws.onmessage = msg => {
            console.log('从服务器获取到了数据:', msg.data);
            const recvData = JSON.parse(msg.data)
            
            // Prioritize requestId for request-response
            if (recvData.requestId && this.pendingRequests.has(recvData.requestId)) {
                const { resolve, reject } = this.pendingRequests.get(recvData.requestId);
                if (recvData.action === 'error') { // Assuming server might send an error action
                    reject(new Error(recvData.data || 'Unknown server error'));
                } else {
                    // Assuming recvData.data contains the actual payload for 'getData'
                    // The original code did JSON.parse(recvData.data) for action 'getData'
                    // If backend sends data directly in recvData.data (already an object/array), no need to parse again.
                    // If backend sends stringified JSON in recvData.data, then parse.
                    // For now, let's assume backend sends the actual data object in recvData.data for requests.
                    resolve(recvData.data); 
                }
                this.pendingRequests.delete(recvData.requestId);
            } 
            // Fallback or parallel use of socketType for broadcast messages
            else if (recvData.socketType && this.callBackMapping[recvData.socketType]) {
                const action = recvData.action
                // This part handles non-requestId based messages, e.g., server-initiated broadcasts
                if (action === 'getData') { // This specific 'getData' might be for a broadcast scenario
                    const realData = JSON.parse(recvData.data) // Original parsing logic
                    this.callBackMapping[recvData.socketType].call(this, realData)
                } else if (action === 'fullScreen') {
                    // Handle fullScreen broadcast if needed
                    this.callBackMapping[recvData.socketType].call(this, recvData)
                } else if (action === 'themeChange') {
                    // Handle themeChange broadcast if needed
                    this.callBackMapping[recvData.socketType].call(this, recvData)
                }
                // Potentially other broadcast actions
            } else {
                console.warn('Received message with no matching requestId or socketType handler:', recvData);
            }
        }
    }

    registerCallBack(socketType, callBack) {
        // For broadcast/event-based messages, not request-response
        this.callBackMapping[socketType] = callBack
    }

    unRegisterCallBack(socketType) {
        // Correctly unregister
        delete this.callBackMapping[socketType]
    }

    sendRetryCount = 0
    send(data) { // data is the message object from the component
        return new Promise((resolve, reject) => {
            if (this.connected) {
                this.sendRetryCount = 0;
                const requestId = this.generateRequestId();
                data.requestId = requestId; // Add requestId to the outgoing message
                
                this.pendingRequests.set(requestId, { resolve, reject });
                
                try {
                    this.ws.send(JSON.stringify(data));
                    console.log('Message sent with requestId:', requestId, data);
                } catch (error) {
                    console.error('Error sending WebSocket message:', error);
                    this.pendingRequests.delete(requestId);
                    reject(error);
                }
                // Set a timeout for the request
                setTimeout(() => {
                    if (this.pendingRequests.has(requestId)) {
                        this.pendingRequests.get(requestId).reject(new Error(`Request timeout for ${requestId}`));
                        this.pendingRequests.delete(requestId);
                    }
                }, 10000); // 10 seconds timeout, adjust as needed

            } else {
                this.sendRetryCount++;
                setTimeout(() => {
                    // Retry the send, which will return a new Promise
                    this.send(data).then(resolve).catch(reject);
                }, this.sendRetryCount * 500);
            }
        });
    }
}