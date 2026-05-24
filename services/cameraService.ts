export interface CameraCapabilities {
    hasTorch: boolean;
    canSwitch: boolean;
}

export const getAvailableCameras = async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
    }
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (err) {
        console.error("Error enumerating devices:", err);
        return [];
    }
};

export const getEnvironmentCameraId = async (): Promise<string | undefined> => {
    const devices = await getAvailableCameras();
    if (devices.length === 0) return undefined;

    // Prioritize devices with "back" or "environment" in label
    const environmentCameras = devices.filter(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('environment')
    );

    // If we find multiple, usually the first one is the primary wide-angle
    if (environmentCameras.length > 0) {
        return environmentCameras[0].deviceId;
    }
    
    // Fallback to the last camera in the list (often the back camera on Android)
    return devices[devices.length - 1].deviceId;
};

export const getCameraStream = async (
    deviceId?: string,
    facingMode: 'environment' | 'user' = 'environment',
    idealWidth = 1920,
    idealHeight = 1080
): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
        video: deviceId ? {
            deviceId: deviceId, // Removed 'exact' to be more resilient
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
        } : {
            facingMode,
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
        },
        audio: false
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
};

export const setTorch = async (stream: MediaStream, enabled: boolean): Promise<boolean> => {
    const track = stream.getVideoTracks()[0];
    if (!track) return false;

    try {
        const capabilities = (track.getCapabilities?.()) as any;
        if (!capabilities || !capabilities.torch) {
            return false;
        }

        await track.applyConstraints({
            advanced: [{ torch: enabled }] as any
        });
        return true;
    } catch (err) {
        console.warn("Torch not supported or failed to toggle", err);
        return false;
    }
};

export const getTrackCapabilities = (stream: MediaStream): CameraCapabilities => {
    const track = stream.getVideoTracks()[0];
    if (!track) return { hasTorch: false, canSwitch: false };

    const capabilities = (typeof track.getCapabilities === 'function') ? track.getCapabilities() as any : {};
    return {
        hasTorch: !!capabilities.torch,
        canSwitch: true 
    };
};