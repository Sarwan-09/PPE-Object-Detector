# AI-Powered PPE Object Detector

## Overview
This project is an AI-based Personal Protective Equipment (PPE) object detection system designed to enhance workplace safety by identifying whether individuals are wearing the necessary PPE in real-time. The detector leverages YOLOv8 (You Only Look Once) for accurate and fast object detection.

---

## Features
- **Real-Time Detection**: Quickly identifies PPE like helmets, gloves, safety goggles, and vests.
- **High Accuracy**: Powered by the state-of-the-art YOLOv8 model.
- **Customizable**: Easily adaptable to detect additional PPE items or specific requirements.
- **Scalable**: Can be deployed on various platforms, including edge devices, servers, or cloud-based solutions.

---

## Dataset and Web Application
We provide a well-curated dataset for PPE detection, available for training or testing purposes. Additionally, a fully functional web application is connected to this system, allowing you to use the AI-powered PPE detector for free. The web app simplifies access and provides real-time detection capabilities directly through your browser.

You can access the dataset and the web application through the following links:
- **Dataset**: [Download Here]()
- **Web Application**: [Access Here]()

---

## Results
The model achieves high performance, with precision and recall rates exceeding 90% on the validation dataset. 

---

## Deployment
### Options
- **Edge Devices**: Deploy on NVIDIA Jetson, Raspberry Pi, or other IoT hardware.
- **Cloud**: Integrate with AWS, Azure, or Google Cloud for large-scale applications.
- **Web**: Use Flask or FastAPI to build a web-based interface.

### Export
Export the model for TensorRT or ONNX for optimized inference:
```bash
python export.py --weights [MODEL_WEIGHTS] --format onnx
```

---

## Contributing
Contributions are welcome! Feel free to fork this repository and submit a pull request.

---

## License
This project is licensed under the MIT License. See `LICENSE` for details.

---

## Contact
For questions or collaboration, reach out via:
- Email: sarwan.shafeeq@google.com
- GitHub: [Sarwan-09](https://github.com/Sarwan-09)

---

## Acknowledgements
- [Ultralytics YOLO](https://github.com/ultralytics/yolov8)
- Open-source contributors and datasets used in this project.

---

Thank you for using the AI-Powered PPE Object Detector! Together, we can build safer workplaces.

