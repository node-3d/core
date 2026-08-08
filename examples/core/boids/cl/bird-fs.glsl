in vec4 vColor;
in float vZ;

out vec4 fragColor;

uniform vec3 color;


void main() {
	fragColor = vec4(mix(vColor.rgb, color, pow(vZ, 1.618)), 1.0);
}
