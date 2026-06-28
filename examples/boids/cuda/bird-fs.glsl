out vec4 fragColor;

in vec4 vColor;
in float vZ;


void main() {
	fragColor = vec4(vColor.xyz - vZ, 1.0);
}
