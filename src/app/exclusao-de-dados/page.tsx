import { LegalPage, CONTACT_EMAIL } from "../legal/LegalPage";

export const metadata = { title: "Exclusão de dados — Postador" };

export default function ExclusaoDeDadosPage() {
    return (
        <LegalPage title="Exclusão de dados">
            <p>
                Você pode remover seus dados do Postador a qualquer momento, por conta própria ou pedindo para nós.
            </p>

            <h2>Pelo painel</h2>
            <p>
                Entre na sua conta e exclua o perfil. Isso apaga em definitivo o token de acesso, as configurações de
                marca e todos os posts gerados daquele perfil, incluindo as imagens hospedadas.
            </p>

            <h2>Revogando o acesso no Instagram</h2>
            <p>
                No app do Instagram: Configurações → Apps e sites → remova o Postador. Nosso acesso à sua conta é
                cortado na hora, e nenhuma publicação nova pode ser feita.
            </p>

            <h2>Solicitando a exclusão completa</h2>
            <p>
                Para apagar sua conta inteira e todos os dados associados, escreva para{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a> a partir do
                e-mail cadastrado, com o assunto &quot;Exclusão de dados&quot;. Concluímos em até 30 dias e confirmamos
                por e-mail quando terminar.
            </p>
        </LegalPage>
    );
}
