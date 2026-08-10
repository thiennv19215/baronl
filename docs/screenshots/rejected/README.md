# Rejected captures

Files in this directory are not acceptance evidence.

- `stage-demo-1080x1920-browser-stitched.png`: rejected because the in-app browser screenshot backend stitched a fixed-position stage more than once while simulating a viewport taller than the host window. The renderer DOM itself reported an exact `1080 × 1920` stage bounding box.

Use `../new/stage-demo-9x16.png` for visual review. It is a native single-frame 9:16 capture (`486 × 863` PNG; the CSS viewport and stage bounding box were `486 × 864`).
