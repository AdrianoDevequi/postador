import Link from "next/link";
import { LegalPage, CONTACT_EMAIL } from "../legal/LegalPage";

export const metadata = { title: "Termos de Uso — Postador" };

export default function TermosPage() {
    return (
        <LegalPage title="Termos de Uso">
            <h2>O serviço</h2>
            <p>
                O Postador gera legendas e imagens com apoio de inteligência artificial e as publica nas contas do
                Instagram que você conectar, de acordo com os temas e horários que você configurar.
            </p>

            <h2>Sua conta</h2>
            <ul>
                <li>Você é responsável por manter sua senha em segurança.</li>
                <li>Você só pode conectar contas do Instagram que lhe pertençam ou que você esteja autorizado a gerir.</li>
                <li>
                    O conteúdo publicado sai em seu nome e é de sua responsabilidade — recomendamos revisar os
                    rascunhos antes de publicar.
                </li>
            </ul>

            <h2>Uso aceitável</h2>
            <p>
                É vedado usar o Postador para publicar conteúdo ilegal, enganoso, ofensivo ou que viole as políticas da
                Meta e do Instagram. Podemos suspender contas que descumpram estas regras.
            </p>

            <h2>Disponibilidade</h2>
            <p>
                O serviço depende de APIs de terceiros (Meta e provedores de IA) e pode ficar indisponível ou sofrer
                alterações. Não garantimos publicação ininterrupta nem resultados específicos de alcance ou engajamento.
            </p>

            <h2>Encerramento</h2>
            <p>
                Você pode encerrar o uso quando quiser, excluindo seus perfis e revogando o acesso no Instagram. Veja{" "}
                <Link href="/exclusao-de-dados" className="text-primary underline">exclusão de dados</Link>.
            </p>

            <h2>Contato</h2>
            <p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a> · Consulte
                também a <Link href="/privacidade" className="text-primary underline">Política de Privacidade</Link>.
            </p>
        </LegalPage>
    );
}
