require('dotenv').config();
import express = require("express");
import { fetchJellyFinData, postJellyFinDataToPhone } from "./utils";
import { PlaybacksResponse, StandardResponse } from "./models";

const router: express.Router = express();

router.get('/jellyfin/playbacks', async(req, res) => {
    const playbackData = await fetchJellyFinData('/sessions');

    const response: any = [];

    if (playbackData[0].NowPlayingQueue.length === 0 ) {
        res.send(response)
    } else {
        for (let i=0; i < playbackData.length; i++) {
            let media: string;

            if ( 'SeriesName' in playbackData[i].NowPlayingItem) {
                media = `${playbackData[i].NowPlayingItem.SeriesName} S${playbackData[i].NowPlayingItem.ParentIndexNumber}E${playbackData[i].NowPlayingItem.IndexNumber}`;
            } else {
                media = `${playbackData[i].NowPlayingItem.Name} (${playbackData[i].NowPlayingItem.ProductionYear})`;
            }

            if (playbackData[i].PlayState.PlayMethod == 'DirectPlay') {
                const item: PlaybacksResponse = {
                    media: media,
                    directplay: true,
                }
                response.push(item);
            } else {
                const item: PlaybacksResponse = {
                    media: media,
                    directplay: false,
                    IsVideoDirect: playbackData[i].TranscodingInfo.IsVideoDirect,
                    IsAudioDirect: playbackData[i].TranscodingInfo.IsAudioDirect,
                    CompletionPercentage: playbackData[i].TranscodingInfo.CompletionPercentage
                }
                response.push(item);
            }
        }
        res.send(response)
    }
})

router.post('/jellyfin/webhook', async (req, res) => {
    postJellyFinDataToPhone(req.body);
    res.status(200).send('webhook recieved')
}) 

router.get('/jellyfin', async (req, res) => {
    const data = await fetchJellyFinData('/sessions');
    res.send(data);
})


module.exports = router;