#!/usr/bin/env python3
#
# This script converts a DICOM file to a thumbnail JPEG file.

from pydicom import *
from pydicom.dataset import Dataset
import cv2
import numpy as np
import sys


def resize_image(image):
    scale_percent = min(600 / image.shape[0], 600 / image.shape[1])
    width = int(image.shape[1] * scale_percent)
    height = int(image.shape[0] * scale_percent)
    return cv2.resize(image, (width, height))


def save_image(ds, image_array, save_name):
    image = image_array.astype(float)
    image_scaled = (np.maximum(image, 0) / image.max()) * 255.0
    if hasattr(ds, 'PhotometricInterpretation'):
        if ds.PhotometricInterpretation == 'MONOCHROME1':
            image_scaled = 255.0 - image_scaled
    image_scaled = image_scaled.astype(np.uint8)
    return cv2.imwrite(save_name, resize_image(image_scaled))


def dcm2jpeg(dcm_file, jpeg_file):
    ds = dcmread(open(dcm_file, 'rb'))
    ds.file_meta.TransferSyntaxUID = '1.2.840.10008.1.2.1'
    if len(ds.pixel_array.shape) >= 3:
        for i in range(0, ds.pixel_array.shape[0]):
            save_name = jpeg_file.replace('.jpg', '_%d.jpg' % i) if i > 0 else jpeg_file
            save_image(ds, ds.pixel_array[i], save_name)
    else:
        save_image(ds, ds.pixel_array, jpeg_file)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 dcm2jpeg.py <dcm_file> <jpeg_file>')
        sys.exit(1)
    dcm2jpeg(sys.argv[1], sys.argv[2])
