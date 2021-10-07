export const Utilities = {
    fullScreen: function(scene) {
        if (!scene.scale.isFullscreen) {
            scene.scale.toggleFullscreen();
        }
    }
}