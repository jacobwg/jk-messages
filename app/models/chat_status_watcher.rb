require 'blather/client/dsl'

class ChatStatusWatcher
  include Blather::DSL

  attr_accessor :uid

  def initialize(watcher, watchee)
    super()
    u = User.where(uid: watcher).first
    w = User.where(uid: watchee).first

    setup("-#{watcher}@chat.facebook.com", u.token)

    presence do |stanza|
      if stanza.from == "-#{watchee}@chat.facebook.com"
        if stanza.unavailable?
          w.go_offline! if w.online?
        else
          w.go_online! if w.offline?
        end
      end
    end

    message do |m|
      #puts m.from.to_s
      #puts m.from.to_s == "-#{watchee}@chat.facebook.com"
      #puts m.chat_state.class
      if m.from.to_s == "-#{watchee}@chat.facebook.com"
        if m.chat_state == :composing
          w.start_writing! unless w.sent?
        elsif m.body
          w.send_message!
        end
      end
    end

    when_ready do
      presence = Blather::Stanza::Presence.new
      presence.type = :unavailable
      write_to_stream presence
    end
  end
end