# Bug Tracker – 2024-05-05

## Platform Mapping Overlay
- **Issue**: Unity platform projection rectangles and magenta center markers still misalign—the markers sit near the bottom-right of each rectangle, indicating scale/anchor math is off.
- **Attempted Fix**: Shifted rectangles to center positions in `buildUnityPlatforms`, but drift persists.
- **Next Steps**: Revisit Unity → Phaser conversion (including scale offsets and collider anchoring) so rectangles and markers share the same center point.
- **Status**: ⏳ Open
