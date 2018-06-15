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

const asyncGetItems = async function getItems(params) {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (!error) {
                resolve(JSON.parse(response.body).data)
            } else {
                reject(error)
            }
        })
    })
}

const asyncGetTweetIdSet = async function getTweetIdSet() {
    return new Promise((resolve, reject) => {
        client.get('statuses/user_timeline', {count: itemLimit + 20}, function(error, tweets, response) {
            if (!error) {
                const idSet = tweets.reduce((setValue, ele) =>{
                    if (!isEmpty(ele.text.match(pattern))) {
                        return setValue.add(ele.text.match(pattern)[0])
                    } else {
                        return setValue
                    }
                }, new Set())
                resolve(idSet)
            } else {
                reject(error)
            }
        })
    })
}

const postTweet = (message) => {
    client.post('statuses/update', {status: message}, (error, tweet, response) => {
        if (!error) {
            console.log("ツイート成功")
            console.log(tweet)
        } else {
            console.log("ツイート失敗")
            console.log(error)
        }
    })
}

const isEmpty = function isEmpty(value) {
    if (value == undefined || value == null) {
        return true
    } else if (Array.isArray(value) && value.length == 0) {
        return true
    } else if (value instanceof Set && value.size == 0) {
        return true
    } else {
        return false
    }
}

const doMain = async function main() {
    try {
        const items = await asyncGetItems()
        const tweetIdSet = await asyncGetTweetIdSet()    
        
        const newItems = items.filter(item => tweetIdSet.has(item.contentId) == false)
        return newItems
    } catch (error) {
        return Promise.reject(new Error(error))
    }
}

exports.doBot = function() {
    doMain().then(v => {
        if (v.length > 0) {
            v.forEach((element, index) => {
                setTimeout(() => {
                    const message = element.title + `(${element.contentId})` + "\n" + sliceDescription(element.description) + "\n" + `http://www.nicovideo.jp/watch/${element.contentId}`
                    postTweet(message)
                }, index * 1000)
            })
        } else {
            console.log("新しい動画は見つかりませんでした")
        }
    }).catch((error) => {
        console.log("通信エラー")
        console.log(error)
    })
}