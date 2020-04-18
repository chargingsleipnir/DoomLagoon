var GameAudio = (() => {

    var musicElems = {};
    var music_Active;

    var frameRate = 60;

    var volumeMusic = 0.5;
    var volumeSFX = 0.5;

    var intervalRef;

    return {
        Init: () => {
            musicElems["landing"] = document.getElementById("Music_Landing");
            musicElems["titleAndOverworld"] = document.getElementById("Music_TitleAndOverworld");
            musicElems["battle"] = document.getElementById("Music_Battle");

            musicElems["landing"].volume = volumeMusic;
            music_Active = musicElems["landing"];
        },
        SetMusicClip: (key, doPlay, setClipVolume = volumeMusic) => {
            music_Active.pause();

            music_Active = musicElems[key];
            music_Active.volume = setClipVolume;
            if(doPlay)
                music_Active.play();
        },
        SetVolumeMusic: (volume) => {
            volumeMusic = volume;
            music_Active.volume = volume;
        },
        SetVolumeSFX: (volume) => {
            volumeSFX = volume;
        },
        MusicPlay: () => {
            music_Active.play();
        },
        MusicPause: () => {
            music_Active.pause();
        },
        FadeOut: (seconds = 1, CB = null) => {
            if(music_Active.paused) {
                if(CB) CB();
                return;
            }

            clearInterval(intervalRef);
            var rate = 1000 / frameRate;
            var incr = (music_Active.volume / frameRate) / seconds;
            var cutoff = incr * 2;
            intervalRef = setInterval(() => {
                if(music_Active.volume <= cutoff) {
                    music_Active.volume = 0;
                    music_Active.pause();
                    clearInterval(intervalRef);
                    if(CB) CB();
                    return;
                }
                music_Active.volume -= incr;
            }, rate);
        },
        FadeIn: (seconds = 1, CB = null) => {
            if(music_Active.paused) {
                if(CB) CB();
                return;
            }

            clearInterval(intervalRef);
            var rate = 1000 / frameRate;
            var incr = (volumeMusic / frameRate) / seconds;
            var cutoff = volumeMusic - (incr * 2);
            var intervalRef = setInterval(() => {
                if(music_Active.volume >= cutoff) {
                    music_Active.volume = volumeMusic;
                    clearInterval(intervalRef);
                    if(CB) CB();
                    return;
                }
                music_Active.volume += incr;
            }, rate); 
        }
    }
})();