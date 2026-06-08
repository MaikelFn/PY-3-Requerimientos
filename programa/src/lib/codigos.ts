//Guardar los codigos de verificacion en memoria, con su fecha de expiracion
const codigos = new Map<string, {codigo: string; expira: number}>()

//Generar un codigo de verificacion de 6 digitos
export function generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

//Guarda el codigo de verificacion para un correo, con su fecha de expiracion
export function guardarCodigo(correo: string, codigo: string) {
    codigos.set(correo.toLowerCase(), {codigo, expira: Date.now() + 15 * 60 * 1000}) //Expira en 15 minutos
}

//Verifica si el codigo de verificacion es correcto para un correo, y lo elimina si es correcto o si ha expirado
export function verificarCodigo(correo: string, codigo: string): boolean {
    const entrada = codigos.get(correo.toLowerCase())
    if (!entrada) return false //No existe el codigo para ese correo
    if (Date.now() > entrada.expira) {
        codigos.delete(correo.toLowerCase()) //Eliminar el codigo expirado
        return false
    }
    return entrada.codigo === codigo
}

//Elimina el codigo de verificacion para un correo
export function eliminarCodigo(correo: string) {
    codigos.delete(correo.toLowerCase())
}