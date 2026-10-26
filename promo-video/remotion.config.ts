import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// 60-second ads render at full quality; use `npm run render:draft` for quick half-size checks.
Config.setCrf(18);
