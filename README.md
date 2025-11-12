[![Experimental Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/oss-category/#experimental)

# New Relic AVPlay Tracker Agent

The New Relic AVPlay Tracker enhances your Samsung Tizen smart TV media applications by tracking video events, playback errors, and other activities, providing comprehensive insights into performance and user interactions.

- The AVPlay tracker is available as a ready-to-use JavaScript snippet for easy copy-paste integration.
- New Relic AVPlay tracker auto-detects events emitted by AVPlay Player.
- Ensure that the **Browser agent** is successfully instrumented before deploying the media tracker.
- For questions and feedback on this package, please visit the [Explorer's Hub](https://discuss.newrelic.com), New Relic's community support forum.
- Looking to contribute to the Player Name agent code base? See [DEVELOPING.md](./DEVELOPING.md) for instructions on building and testing the browser agent library, and Contributors.

## Adding The AVPlay Tracker To Your Project

To integrate New Relic Tracker Agent into your web application effectively, you'll need to instrument the Browser Agent code first and then add the player script. Below is a guide on how to do this within your HTML file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Relic Tracker Integration</title>
    <script src="path/to/browser-agent.js"></script>
    <!-- snippet code generated  -->
    <script src="path/to/AVPlay-tracker.js"></script>
  </head>
  <body>
    <!-- Your HTML content -->
  </body>
</html>
```
## Adding the agent package to your project

To make the tracker available to your application, install via [NPM](https://docs.npmjs.com/cli/v8/commands/npm-install) or [Yarn](https://classic.yarnpkg.com/lang/en/docs/cli/install/).

```shell
$ npm install @newrelic/video-avplay
```

```shell
$ yarn add @newrelic/video-avplay
```

## Instantiating the AVPlay Tracker

```javascript
//Add import statement
import AVPlayTracker from "@newrelic/video-avplay";
const options = {
  info: {
      beacon: '',
      licenseKey: '',
      applicationID: '',
  },
  customData: {
    environment: 'development',
    platform: 'Tizen',
    deviceModel: 'Samsung Smart TV'
  },
  title: 'Big Buck Bunny',
  monitorInterval: 500, // optional polling interval in milliseconds
};

const tracker = new AVPlayTracker(player, options);

// For setting userId
tracker.setUserId('userId');

// Call player.open only after the tracker is created so the tracker
// can wrap the method and capture the content source.
player.open('https://example.com/video.mpd');

// For Sending custom Action with Attributes
tracker.sendCustom('CUSTOM_ACTION', 'state time', {
  test1: 'value1',
  test2: 'value2',
});
```

> **Important:** The `monitorInterval` option controls how frequently (in milliseconds) `AVPlayTracker` polls the player's state. If you do not specify a value, it defaults to `500` ms.

> **Note:** The tracker overrides `player`'s some functions to capture the media source URI and other resources. Always instantiate `AVPlayTracker` before calling `player.open`.

## Data Model

To understand which actions and attributes are captured and emitted by the AVPlay Player under different event types, see [DataModel.md](./DATAMODEL.md).

## Support

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic [Explorer's Hub](https://discuss.newrelic.com).

We encourage you to bring your experiences and questions to the [Explorer's Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Contributing

We encourage your contributions to improve New Relic AVPlay Tracker! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project. If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company, please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [our bug bounty program](https://docs.newrelic.com/docs/security/security-privacy/information-security/report-security-vulnerabilities/).

## License

New Relic AVPlay Tracker is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
