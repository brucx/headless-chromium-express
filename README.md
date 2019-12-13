# HEADLESS-CHROMIUM-EXPRESS

无头浏览器海报渲染服务

环境变量：

```
REDIS_URI=redis://:authpassword@127.0.0.1:6380/4
```

接口：

```
#### 新建 handlebars 的 html 模板
curl --request POST \
  --url http://localhost:3000/template \
  --header 'content-type: application/json' \
  --data '{
    "html": "<h1>hello world!{{text}}</h1>"
  }'

#### 获取模板列表
curl --request GET \
  --url http://127.0.0.1:3000/templates
  
#### 获取单个模板
curl --request GET \
  --url http://127.0.0.1:3000/template/0
  
#### 生成海报
curl --request POST \
  --url http://localhost:3000/generator \
  --header 'content-type: application/json' \
  --data '{
    "templateId": 4,
    "params": {
      "text": "ytyytr"
    }
  }'
```
