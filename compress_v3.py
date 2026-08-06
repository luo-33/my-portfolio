# -*- coding: utf-8 -*-
"""v3 压缩：码率控制，目标单个视频 2-6MB，适合弱网流畅播放"""
import subprocess
import time

from pathlib import Path

PROJECT = Path(r"C:\Users\86158\Desktop\my-portfolio")
FFMPEG = r"C:\Users\86158\.workbuddy\binaries\python\envs\default\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

SRC_DIRS = {
    "team-video": PROJECT / "personal" / "images" / "team-video",
    "person-video": PROJECT / "personal" / "images" / "person-video",
}
OUT = PROJECT / "_web_videos_v3"

VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi", ".webm"}


def compress_lite(src, dst):
    """低码率压缩：
    - 720p（横屏宽≤1280，竖屏高≤1280）
    - H.264 Main + yuv420p + CFR 30
    - CRF 30 + maxrate 700k（码率上限控制，避免大动态视频体积失控）
    - 音频 64k mono→stereo 96k 改 64k
    """
    vf = ("scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',"
          "setsar=1")
    cmd = [
        FFMPEG, "-y", "-i", str(src),
        "-vf", vf,
        "-c:v", "libx264",
        "-profile:v", "main",
        "-level:v", "4.0",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-vsync", "cfr",
        "-crf", "30",
        "-maxrate", "700k",
        "-bufsize", "1400k",
        "-preset", "slow",
        "-g", "60",
        "-sc_threshold", "0",
        "-c:a", "aac", "-b:a", "64k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart",
        str(dst),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  FAIL: {src.name}\n  {r.stderr[-400:]}")
        return False
    return True


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    start = time.time()
    total_in = 0
    total_out = 0

    for cat, src_dir in SRC_DIRS.items():
        out_dir = OUT / cat
        out_dir.mkdir(exist_ok=True)
        print(f"\n=== {cat} ===")
        for f in sorted(src_dir.iterdir()):
            if not (f.is_file() and f.suffix.lower() in VIDEO_EXT):
                continue
            dst = out_dir / f.name
            if dst.exists():
                print(f"  已存在: {f.name} ({dst.stat().st_size/1024/1024:.1f} MB)")
                total_in += f.stat().st_size
                total_out += dst.stat().st_size
                continue
            total_in += f.stat().st_size
            print(f"  压缩中: {f.name} ({f.stat().st_size/1024/1024:.1f} MB)...")
            if compress_lite(f, dst):
                total_out += dst.stat().st_size
                print(f"    -> {dst.stat().st_size/1024/1024:.1f} MB")
            else:
                dst.unlink(missing_ok=True)

    print(f"\n{'='*50}")
    print(f"完成！{total_in/1024/1024:.0f} MB -> {total_out/1024/1024:.0f} MB，用时 {(time.time()-start)/60:.1f} 分钟")
    print(f"输出: {OUT}")


if __name__ == "__main__":
    main()