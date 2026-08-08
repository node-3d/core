in vec2 tc;
out vec4 fragColor;

#ifndef NUM_COLORS
	#define NUM_COLORS 8
#endif

#define IDX_LAST (NUM_COLORS - 1)

uniform bool isSwap;
uniform int modeGrayscale;
uniform sampler2D t;
uniform vec3 colors[NUM_COLORS];


int getIndex(float value) {
	return clamp(int(value * float(IDX_LAST) + 0.5), 0, IDX_LAST);
}


vec3 paletteSwap(float gray, vec3 colors[NUM_COLORS]) {
	int index = getIndex(gray);
	return colors[index];
}

float toGrayscale(vec3 rgb) {
	if (modeGrayscale == 1) {
		return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b; // Luminosity
	}
	if (modeGrayscale == 2) {
		return 0.5 * (max(rgb.r, max(rgb.g, rgb.b)) + min(rgb.r, min(rgb.g, rgb.b))); // Lightness
	}
	return (rgb.r + rgb.g + rgb.b) * 0.3333333; // Average
}

void main() {
	vec4 rgba = sRGBTransferOETF(texture(t, tc));
	float gray = toGrayscale(rgba.rgb);
	vec3 finalColor = rgba.rgb;
	if (modeGrayscale > 0) {
		finalColor = vec3(gray);
	}
	fragColor = vec4(mix(finalColor, paletteSwap(gray, colors), bvec3(isSwap)), rgba.a);
}
