'use strict'

const request = require('request')
const searchWord = "elona"
const itemLimit = 10
const url = `https://api.search.nicovideo.jp/api/v2/video/contents/search?q=${searchWord}&targets=tags&fields=contentId,title,description,tags,categoryTags,viewCounter,mylistCounter,commentCounter,startTime,thumbnailUrl&_sort=-startTime&_offset=0&_limit=${itemLimit}&_context=apiguide`

const Twitter = require('twitter')

// キーが入ってるのでgitignore
const Settings = require("./setting.js")
const client = new Twitter(Settings.client())

const pattern = /(sm\d+)/

const sliceDescription = function(str) {
    const strWithoutHtmlTag = str.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'')
    if (strWithoutHtmlTag.length > 40) {
        return strWithoutHtmlTag.slice(0, 38) + "…"
    } else {
        return strWithoutHtmlTag
    }
}

request(url, function (error, response, body) {
    JSON.parse(response.body).data.forEach((element, index) => {
        setTimeout(() => {
            const message = element.title + `(${element.contentId})` + "\n" + sliceDescription(element.description) + "\n" + `http://www.nicovideo.jp/watch/${element.contentId}`
        }, index * 1000)
    })
})

client.get('statuses/user_timeline', {count: itemLimit + 1}, function(error, tweets, response) {
    if (!error) {
        const idSet = tweets.reduce((setValue, ele) =>{
            return setValue.add(ele.text.match(pattern)[0])
        }, new Set())
        console.log(idSet)
    }
})