import { ArrayConfig } from "./store/store.service";

export const presets: ArrayConfig[] = [
    {
        name: "URA 8x8 0.5lambda",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz',
        },
        config: {
            type: 'ura',
            elementsX: 8,
            elementsY: 8,
            pitchX: 0.0043,
            pitchY: 0.0043,
        },
        citation: {
            urlTitle: 'ULTSYM.2017.8091892',
            title: 'Air-coupled 40-KHZ ultrasonic 2D-phased array based on a 3D-printed waveguide structure',
            kind: 'Academic',
            url: 'https://doi.org/10.1109/ULTSYM.2017.8091892',
            authors: "A. Jäger et. al.",
            year: 2017,
        },
        transducerDiameter: 0.0034,
        transducerModel: "Piston"
    },
    {
        name: "Line 6 0.5lambda",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        citation: {
            kind: 'Academic',
            url: "https://doi.org/10.1117/12.783988",
            urlTitle: "10.1117/12.783988",
            title: "Ultrasonic phased array sensor for electric travel aids for visually impaired people",
            authors: "T. Takahashi et. al.",
            year: 2008
        },
        config: {
            type: 'ura',
            elementsX: 6,
            elementsY: 1,
            pitchX: 0.0043,
            pitchY: 0.0043,
        },
        transducerDiameter: 0.0034,
        transducerModel: "Point"
    },
    {
        name: "Line 8 0.5lambda wide",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        citation: {
            kind: 'Academic',
            url: "https://doi.org/10.1109/ICSENS.2015.7370187",
            urlTitle: "ICSENS.2015.7370187",
            title: "Versatile air-coupled phased array transducer for sensor applications",
            authors: "A. Unger et. al.",
            year: 2015,
        },
        transducerDiameter: 0.0034,
        config: {
            type: 'ura',
            elementsX: 8,
            elementsY: 12,
            pitchX: 0.0043,
            pitchY: 0.006,
        },
        transducerModel: "Point"
    },
    {
        name: "Urtis",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        config: {
            type: 'ura',
            elementsX: 6,
            elementsY: 5,
            pitchX: 0.00385,
            pitchY: 0.00385,
        },
        transducerDiameter: 0.0002,
        citation: {
            kind: 'Academic',
            url: "https://ieeexplore.ieee.org/document/9053536",
            urlTitle: "10.1109/ICASSP40776.2020.9053536",
            title: "Urtis: a Small 3d Imaging Sonar Sensor for Robotic Applications",
            authors: "Thomas Verellen et. al.",
            year: 2020,
        },
        transducerModel: "Point"
    },
    {
        name: "HiRIS",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        config: {
            type: 'ura',
            elementsX: 32,
            elementsY: 32,
            pitchX: 0.0039,
            pitchY: 0.0039,
        },
        transducerDiameter: 0.0002,
        citation: {
            kind: 'Academic',
            url: "https://ieeexplore.ieee.org/document/10491247",
            urlTitle: "10.1109/ACCESS.2024.3385232",
            title: "HiRIS: An Airborne Sonar Sensor With a 1024 Channel Microphone Array for In-Air Acoustic Imaging",
            authors: "Laurijssen et. al.",
            year: 2024,
        },
        transducerModel: "Point"
    },
    {
        name: "Spiral Array",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        config: {
            type: 'spiral',
            diameter: 0.2,
            elementCount: 64,
            startWithZero: true,
        },
        transducerDiameter: 0.009,
        citation: {
            kind: 'Academic',
            url: "https://ieeexplore.ieee.org/document/9678369",
            urlTitle: "10.1109/OJUFFC.2022.3142710",
            title: "Air-Coupled Ultrasonic Spiral Phased Array for High-Precision Beamforming and Imaging",
            authors: "Allevato et. al.",
            year: 2022,
        },
        transducerModel: "Point"
    },
        {
        name: "Hex Array",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        config: {
            type: 'hex',
            elements: 4,
            pitch: 0.0043,
            omitCenter: true
        },
        transducerDiameter: 0.000325,
        citation: {
            kind: 'Academic',
            url: "https://ieeexplore.ieee.org/document/9278601/",
            urlTitle: "10.1109/SENSORS47125.2020.9278601",
            title: "Embedded Air-Coupled Ultrasonic 3D Sonar  System with GPU Acceleration",
            authors: "Allevato et. al.",
            year: 2020,
        },
        transducerModel: "Point"
    },
    {
        name: "eRTIS",
        environment: {
            speedOfSound: 343,
            environmentHint: 'Air',
            excitationFrequencyBase: 40,
            excitationFrequencyMultiplier: 'kHz'
        },
        config: {
            type: 'free',
            positions: [
                { "x": 0.022055606, "y": -0.014225825 },
                { "x": 0.013488706, "y": -0.016955325 },
                { "x": 0.002350706, "y": -0.005861725 },
                { "x": 0.019999806, "y": 0.001442875 },
                { "x": 0.009814106, "y": 0.006446875 },
                { "x": 0.006187006, "y": 0.012616275 },
                { "x": -0.001856194, "y": 0.018271775 },
                { "x": -0.004714994, "y": 0.007161975 },
                { "x": -0.018600094, "y": 0.015132775 },
                { "x": -0.027606794, "y": 0.010815275 },
                { "x": -0.007513294, "y": -0.002735525 },
                { "x": -0.023822094, "y": -0.010428125 },
                { "x": -0.009559394, "y": -0.009933525 },
                { "x": -0.022553094, "y": -0.002041825 },
                { "x": 0.032796506, "y": -0.003681825 },
                { "x": 0.018872206, "y": -0.006176725 },
                { "x": 0.006729406, "y": -0.019302925 },
                { "x": 0.025336806, "y": -0.003796925 },
                { "x": 0.026050806, "y": 0.006820875 },
                { "x": 0.007354006, "y": -0.000084125 },
                { "x": 0.019358706, "y": 0.012333575 },
                { "x": 0.012676606, "y": 0.017320975 },
                { "x": -0.008673594, "y": 0.016642075 },
                { "x": -0.014591994, "y": 0.008010675 },
                { "x": -0.021354994, "y": 0.004740675 },
                { "x": -0.015168794, "y": -0.001419925 },
                { "x": -0.006331494, "y": -0.018844625 },
                { "x": -0.032524194, "y": -0.005180825 },
                { "x": -0.016001394, "y": -0.012876725 },
                { "x": -0.031014894, "y": 0.002577375 },
                { "x": 0.004887606, "y": -0.012190925 },
                { "x": 0.033928706, "y": 0.005403375 }
            ]
        },
        transducerDiameter: 0.000325,
        citation: {
            kind: 'Academic',
            url: "https://doi.org/10.1109/ICRA.2019.8794419",
            urlTitle: "10.1109/ICRA.2019.8794419",
            title: "eRTIS: Embedded Real-Time 3D Sonar Imaging System",
            authors: "R. Kerstens et. al.",
            year: 2019,
        },
        transducerModel: "Point"
    },
]