import type * as THREE from 'three';

const onShaderError: NonNullable<THREE.WebGLRenderer['debug']['onShaderError']> = (
	gl,
	_program,
	vs,
	fs,
) => {
	const parseForErrors = (shader: WebGLShader, name: string) => {
		const errors = (gl.getShaderInfoLog(shader) || '').trim();
		const prefix = `Errors in ${name}:\n\n${errors}`;

		if (errors !== '') {
			const code = (gl.getShaderSource(shader) || '').replaceAll('\t', '  ');
			const lines = code.split('\n');
			let linedCode = '';
			let i = 1;
			for (const line of lines) {
				linedCode += `${i < 10 ? ' ' : ''}${i}:\t\t${line}\n`;
				i++;
			}

			console.error(`${prefix}\n${linedCode}`);
		}
	};

	parseForErrors(vs, 'Vertex Shader');
	parseForErrors(fs, 'Fragment Shader');
};

export const debugShaders = (renderer: THREE.WebGLRenderer, isEnabled: boolean): void => {
	renderer.debug.checkShaderErrors = isEnabled;

	if (!isEnabled) {
		renderer.debug.onShaderError = null;
		return;
	}

	renderer.debug.onShaderError = onShaderError;
};
