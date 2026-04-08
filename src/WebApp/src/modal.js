let modal, modalBody, okBtnElement, cancelBtnElement;

function createModal(cancelButton = 'Cancel', okButton = 'OK') {

    modal = document.createElement("div");
    modal.className = "modal hidden";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    modalBody = document.createElement("div");
    modalBody.id = "modal-body";

    const modalButtons = document.createElement("div");
    modalButtons.className = "modal-buttons";

    okBtnElement = document.createElement("button");
    okBtnElement.id = "modal-ok";
    okBtnElement.innerHTML = okButton ?? 'Close';
    
    if(cancelButton){
        cancelBtnElement = document.createElement("button");
        cancelBtnElement.id = "modal-cancel";
        cancelBtnElement.innerHTML = cancelButton;

        modalButtons.appendChild(cancelBtnElement);
    }

    modalButtons.appendChild(okBtnElement);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalButtons);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
}

export function showModal(htmlContent, cancelBtn = 'Cancel', okButton = 'OK') {
    createModal(cancelBtn, okButton);
    
    return new Promise(resolve => {
        modalBody.innerHTML = htmlContent;

        modal.classList.remove("hidden");

        const focusElement= document.getElementById("focus");
        if(focusElement){
            focusElement.focus();
            focusElement.select();
        }

        function close(result) {
            modal.classList.add("hidden");
            okBtnElement?.removeEventListener("click", onOk);
            cancelBtnElement?.removeEventListener("click", onCancel);
            resolve({ ok: result, modal});

            modal.remove();
        }

        function onOk() {
            close(true);
        }

        function onCancel() {
            close(false);
        }

        okBtnElement?.addEventListener("click", onOk);
        cancelBtnElement?.addEventListener("click", onCancel);
    });
}