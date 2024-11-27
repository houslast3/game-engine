export class SoundSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        this.isMuted = false;
        this.volume = 1;
    }

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            // Resume AudioContext on user interaction
            document.addEventListener('click', () => {
                if (this.context.state === 'suspended') {
                    this.context.resume();
                }
            }, { once: true });
        } catch (error) {
            console.error('Web Audio API is not supported in this browser', error);
        }
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, {
                buffer: audioBuffer,
                volume: 1,
                isLooping: false
            });
            
            return true;
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
            return false;
        }
    }

    async loadMusic(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.music.set(name, {
                buffer: audioBuffer,
                volume: 1,
                isLooping: true
            });
            
            return true;
        } catch (error) {
            console.error(`Error loading music ${name}:`, error);
            return false;
        }
    }

    playSound(name, options = {}) {
        if (!this.context || this.isMuted) return null;
        
        const sound = this.sounds.get(name);
        if (!sound) {
            console.error(`Sound ${name} not found`);
            return null;
        }

        const source = this.context.createBufferSource();
        source.buffer = sound.buffer;
        
        // Create gain node for this instance
        const gainNode = this.context.createGain();
        gainNode.gain.value = (options.volume !== undefined ? options.volume : sound.volume) * this.volume;
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Set loop
        source.loop = options.loop !== undefined ? options.loop : sound.isLooping;
        
        // Start playback
        if (options.delay) {
            source.start(this.context.currentTime + options.delay);
        } else {
            source.start();
        }

        // Return control object
        return {
            source,
            gainNode,
            stop: () => source.stop(),
            setVolume: (value) => {
                gainNode.gain.value = value * this.volume;
            },
            setLoop: (value) => {
                source.loop = value;
            }
        };
    }

    playMusic(name, fadeInDuration = 0) {
        if (!this.context || this.isMuted) return;
        
        const music = this.music.get(name);
        if (!music) {
            console.error(`Music ${name} not found`);
            return;
        }

        // Stop current music if playing
        if (this.currentMusic) {
            this.stopMusic(fadeInDuration);
        }

        const source = this.context.createBufferSource();
        source.buffer = music.buffer;
        
        const gainNode = this.context.createGain();
        if (fadeInDuration > 0) {
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(
                music.volume * this.volume,
                this.context.currentTime + fadeInDuration
            );
        } else {
            gainNode.gain.value = music.volume * this.volume;
        }
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.loop = music.isLooping;
        source.start();

        this.currentMusic = {
            source,
            gainNode,
            name
        };
    }

    stopMusic(fadeOutDuration = 0) {
        if (!this.currentMusic) return;

        if (fadeOutDuration > 0) {
            this.currentMusic.gainNode.gain.linearRampToValueAtTime(
                0,
                this.context.currentTime + fadeOutDuration
            );
            setTimeout(() => {
                this.currentMusic.source.stop();
                this.currentMusic = null;
            }, fadeOutDuration * 1000);
        } else {
            this.currentMusic.source.stop();
            this.currentMusic = null;
        }
    }

    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.source.stop();
        }
    }

    resumeMusic() {
        if (this.currentMusic) {
            this.playMusic(this.currentMusic.name);
        }
    }

    setMasterVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.masterGain.gain.value = this.volume;
    }

    setSoundVolume(name, value) {
        const sound = this.sounds.get(name);
        if (sound) {
            sound.volume = Math.max(0, Math.min(1, value));
        }
    }

    setMusicVolume(name, value) {
        const music = this.music.get(name);
        if (music) {
            music.volume = Math.max(0, Math.min(1, value));
            if (this.currentMusic && this.currentMusic.name === name) {
                this.currentMusic.gainNode.gain.value = music.volume * this.volume;
            }
        }
    }

    mute() {
        this.isMuted = true;
        this.masterGain.gain.value = 0;
    }

    unmute() {
        this.isMuted = false;
        this.masterGain.gain.value = this.volume;
    }

    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
    }

    update() {
        // Handle any periodic updates if needed
    }
}
