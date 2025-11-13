# Introduction

This document provides an overview of the Events and Attributes used for media monitoring in New Relic.

# Glossary

This section defines the key terms used in the context of New Relic Media monitoring:

## Event Types

- **videoAction**: Events triggered by general video interactions, such as starting, pausing, or seeking.
- **videoAdAction**: Events related to ad playback, such as starting, completing, or skipping an ad.
- **videoErrorAction**: Events triggered by errors encountered during video or ad playback.
- **videoCustomAction**: Custom events defined to capture specific actions or interactions beyond default event types.

## Attribute

An Attribute is a piece of data associated with an event. Attributes provide additional context or details about the event, such as the video’s title, duration, or playback position.

- Most attributes are included with every event.
- Some attributes are specific to certain event types, such as ad-related data sent with ad events.

## Event Type Reference

### VideoAction

| Attribute Name           | Definition                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| actionName               | The specific action being performed in the video player, such as play, pause, resume, content buffering, etc.                                      |
| appName                  | The name of the application.                                                                                                                       |
| playerName               | The name of the video player.                                                                                                                      |
| playerVersion            | The version of the video player.                                                                                                                   |
| deviceType               | The specific type of the device: iPhone 8, iPad Pro, etc.                                                                                          |
| viewSession              | Trackers will generate unique IDs for every new video session. This could be the session ID from the client.                                       |
| viewId                   | Trackers will generate unique IDs for every new video iteration.                                                                                   |
| contentPlayhead          | Playhead (currentTime) of the video, in ms.                                                                                                        |
| isBackgroundEvent        | If the player is hidden by another window.                                                                                                         |
| asn                      | Autonomous System Number: a unique number identifying a group of IP networks that serves the content to the end user.                              |
| asnLatitude              | The latitude of the geographic center of the postal code where the Autonomous System Network is registered. This is not the end user's latitude.   |
| asnLongitude             | The longitude of the geographic center of the postal code where the Autonomous System Network is registered. This is not the end user's longitude. |
| asnOrganization          | The organization that owns the Autonomous System Number. Often an ISP, sometimes a private company or institution.                                 |
| timestamp                | The time (date, hour, minute, second) at which the interaction occurred.                                                                           |
| instrumentation.provider | Player/agent name.                                                                                                                                 |
| instrumentation.name     | Name of the instrumentation collecting the data.                                                                                                   |
| instrumentation.version  | Agent’s version.                                                                                                                                   |
| numberOfErrors           | Number of errors occured                                                                                                              |
| numberOfVideos           | Number of videos played                                                                                                              |
| pageUrl           | The content url of the video                                                                                                              |
| regionCode           | Player's current country region code                                                                                                              |
| src           | Specifies either desktop application or browser                                                                                                |


#### List of possible Video Actions

| Action Name              | Definition                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| PLAYER_READY             | The player is ready to start sending events.                                                     |
| DOWNLOAD                 | Downloading data.                                                                                |
| CONTENT_REQUEST          | Content video has been requested.                                                                |
| CONTENT_START            | Content video started (first frame shown).                                                       |
| CONTENT_END              | Content video ended.                                                                             |
| CONTENT_PAUSE            | Content video paused.                                                                            |
| CONTENT_RESUME           | Content video resumed.                                                                           |
| CONTENT_SEEK_START       | Content video seek started.                                                                      |
| CONTENT_SEEK_END         | Content video seek ended.                                                                        |
| CONTENT_BUFFER_START     | Content video buffering started.                                                                 |
| CONTENT_BUFFER_END       | Content video buffering ended.                                                                   |
| CONTENT_HEARTBEAT        | Content video heartbeat, an event that happens once every 30 seconds while the video is playing. |
