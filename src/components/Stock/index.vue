<script setup>
import { ref } from 'vue';

const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const sendWithContext = ref(true); // 新增：控制是否携带上下文
const apiKey = ref('sk-a0a3a28a8cc64b6cbb8d076e4b3d0ba1'); // 请替换为您的真实 OpenAI API 密钥
const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions');

const clearChatDisplay = () => {
  messages.value = [];
};

const clearChatContext = () => {
  sendWithContext.value = false;
  console.log("下次发送将不携带历史上下文");
  // 添加一个特殊类型的消息来表示分割线
  messages.value.push({
    id: Date.now() + Math.random(),
    type: 'divider', // 特殊类型
    content: '--- 上下文已清除 ---'
  });
};

const handleSendMessage = async () => {
  if (!userInput.value.trim()) return;

  const currentUserInput = userInput.value; // 保存当前用户输入
  const userMessage = { id: Date.now() + Math.random(), sender: 'user', content: currentUserInput };
  messages.value.push(userMessage);
  isLoading.value = true;
  userInput.value = ''; // 清空输入框

  // 构建发送给 OpenAI API 的 messages 数组
  const systemMessage = {"role": "system", "content": "You are a helpful assistant."};
  let openAIMessagesArray = [];

  if (sendWithContext.value) {
    const historyMessages = messages.value.slice(0, -1).map(msg => ({ //排除当前用户输入的消息
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    openAIMessagesArray = [systemMessage, ...historyMessages];
  } else {
    openAIMessagesArray = [systemMessage];
    console.log('Sending without context');
  }
  openAIMessagesArray.push({ role: 'user', content: currentUserInput });


  try {
    const response = await fetch(apiEndpoint.value, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: openAIMessagesArray
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponseText = data.choices[0].message.content;
        messages.value.push({ id: Date.now() + Math.random(), sender: 'ai', content: aiResponseText });
      } else {
        console.error('Error: Invalid API response structure', data);
        messages.value.push({ id: Date.now() + Math.random(), sender: 'ai', content: '抱歉，AI回复格式错误。' });
      }
    } else {
      const errorData = await response.json().catch(() => ({ message: response.statusText })); // 尝试解析JSON错误，否则使用状态文本
      console.error('Error calling OpenAI API:', response.status, errorData);
      messages.value.push({ id: Date.now() + Math.random(), sender: 'ai', content: `调用API失败: ${errorData.message || '未知错误'}` });
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    messages.value.push({ id: Date.now() + Math.random(), sender: 'ai', content: `调用API时发生网络错误: ${error.message}` });
  } finally {
    isLoading.value = false;
    // 发送消息后，重置 sendWithContext 状态
    if (!sendWithContext.value) {
      sendWithContext.value = true;
    }
  }
};
</script>

<template>
  <div class="chat-container">
    <div class="messages-area">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.sender === 'user' ? 'message-user' : (message.sender === 'ai' ? 'message-ai' : '') , message.type === 'divider' ? 'message-divider' : '']"
      >
        <template v-if="message.type === 'divider'">
          <hr class="context-divider-line">
          <span class="context-divider-text">{{ message.content }}</span>
          <hr class="context-divider-line">
        </template>
        <template v-else>
          {{ message.content }}
        </template>
      </div>
      <div v-if="isLoading" class="loading-indicator">AI正在思考中...</div>
    </div>
    <div class="input-area">
      <textarea
        v-model="userInput"
        @keyup.enter.prevent="handleSendMessage"
        placeholder="在此输入您的问题..."
      ></textarea>
      <button @click="handleSendMessage" class="chat-button">发送</button>
      <button @click="clearChatDisplay" class="chat-button small-button">清除对话</button>
      <button @click="clearChatContext" class="chat-button small-button">清除上下文</button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 25, 47, 0.75); /* 深色主题背景 */
  color: #ccd6f6; /* 浅色文字 */
}

.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px; /* 消息之间的间距 */
}

.message {
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word; /* 长消息换行 */
}

.message-user {
  background-color: #007bff; /* 用户消息背景色 */
  color: white;
  align-self: flex-end; /* 用户消息靠右 */
  border-bottom-right-radius: 5px;
}

.message-ai {
  background-color: #2c3e50; /* AI消息背景色 */
  color: #e0e0e0;
  align-self: flex-start; /* AI消息靠左 */
  border-bottom-left-radius: 5px;
}

.loading-indicator {
  text-align: center;
  padding: 10px;
  color: #8892b0; /* 与占位符颜色相似 */
  font-style: italic;
}

.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #1f2a40; /* 输入区域上边框 */
  background-color: rgba(10, 25, 47, 0.75); /* 与容器背景一致或稍作区分 */
}

textarea {
  flex-grow: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #30405a;
  background-color: #1e2d47; /* 输入框背景 */
  color: #ccd6f6; /* 输入框文字颜色 */
  resize: none; /* 禁止调整大小 */
  min-height: 40px; /* 最小高度 */
  max-height: 120px; /* 最大高度，防止过长 */
  font-family: inherit; /* 继承父元素字体 */
  line-height: 1.5;
}

textarea::placeholder {
  color: #8892b0; /* 占位符文字颜色 */
}

.chat-button {
  margin-left: 8px; /* 统一左边距 */
  padding: 8px 12px; /* 调整内边距使按钮变窄 */
  border-radius: 6px; /* 轻微调整圆角 */
  border: none;
  background-color: #007bff; /* 按钮背景色 */
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px; /* 统一发送按钮字号 */
  white-space: nowrap; /* 防止文字换行 */
}

.small-button {
  font-size: 13px; /* 清除按钮使用更小的字号 */
  padding: 8px 10px; /* 清除按钮更窄一些 */
}


.chat-button:hover {
  background-color: #0056b3; /* 按钮悬停背景色 */
}

.message-divider {
  width: 100%;
  text-align: center;
  color: #8892b0;
  font-size: 0.9em;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-divider-line {
  flex-grow: 1;
  border: none;
  border-top: 1px dashed #30405a; /* 分割线样式 */
  margin: 0 10px;
}

.context-divider-text {
  padding: 0 5px;
}


/* 滚动条样式 (可选，美化) */
.messages-area::-webkit-scrollbar {
  width: 8px;
}

.messages-area::-webkit-scrollbar-track {
  background: rgba(10, 25, 47, 0.75);
}

.messages-area::-webkit-scrollbar-thumb {
  background-color: #30405a;
  border-radius: 4px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background-color: #4a5c7a;
}
</style>